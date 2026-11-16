(() => {
  const region = {x: 4480, y: 13312, span: 768, samples: 385};
  const maxAngle = 48;
  const atlasSize = 4096;
  const chartSize = {width: 16384, height: 17192};
  const maxHeight = 32;
  const lisbonMaxHeight = 1020 * .0135;
  const fade = (distance, width) => Math.max(0, Math.min(1, distance / width));

  function project(w, h, degrees) {
    const radians = degrees * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const cx = w / 2, cy = h / 2, focal = Math.max(w, h) * 1.35;
    const lift = fade(degrees, 12);
    const reliefScale = lift * lift * (3 - 2 * lift);
    const matrix = `matrix3d(1,0,0,0,0,${cos},0,${-sin / focal},0,0,1,0,0,0,0,1)`;
    return {
      degrees, cx, cy, cos, sin, focal, reliefScale,
      apply(x, y, height = 0) {
        const v = y - cy, depth = 1 - (v * sin + height * cos) / focal;
        if (depth <= 0) return {x: Infinity, y: Infinity};
        return {x: cx + (x - cx) / depth, y: cy + (v * cos - height * sin) / depth};
      },
      invert(x, y, height = 0) {
        const screenY = y - cy;
        const v = (screenY * (1 - height * cos / focal) + height * sin) /
          (cos + screenY * sin / focal);
        const depth = 1 - (v * sin + height * cos) / focal;
        return {x: cx + (x - cx) * depth, y: cy + v};
      },
      transform(x, y) {
        return `translate3d(${cx}px,${cy}px,0) ${matrix} translate3d(${x - cx}px,${y - cy}px,0)`;
      }
    };
  }

  function sourceRect(projection, zoom) {
    const {cx, cy} = projection;
    const highest = maxHeight * zoom * projection.reliefScale;
    // Bound both planes so a mountain just beyond the sea-level view still has source tiles.
    const corners = [projection.invert(0, 0), projection.invert(0, 2 * cy),
      projection.invert(0, 0, highest), projection.invert(0, 2 * cy, highest)];
    const left = Math.floor(Math.min(...corners.map(point => point.x)));
    const right = Math.ceil(2 * cx - left);
    const top = Math.floor(Math.min(...corners.map(point => point.y)));
    const bottom = Math.ceil(Math.max(...corners.map(point => point.y)));
    return {left, top, width: right - left, height: bottom - top};
  }

  async function loadHeightAsset(file, expected, compressed = false) {
    const response = await fetch('assets/europe/terrain/' + file, {cache: 'force-cache'});
    if (!response.ok) throw new Error(`Terrain elevation ${file}: ${response.status}`);
    const bytes = compressed
      ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
      : await response.arrayBuffer();
    if (bytes.byteLength !== expected) throw new Error(`Invalid elevation dimensions: ${file}`);
    return new Uint8Array(bytes);
  }

  async function loadHeights() {
    const [europe, lisbon] = await Promise.all([
      loadHeightAsset('europe-elevation-v1.bin.gz', atlasSize ** 2, true),
      loadHeightAsset('lisbon-elevation.bin?v=1', region.samples ** 2)
    ]);
    return {europe, lisbon};
  }

  function bilinear(data, size, column, row) {
    column = Math.max(0, Math.min(size - 1, column));
    row = Math.max(0, Math.min(size - 1, row));
    const x = Math.floor(column), y = Math.floor(row);
    const nextX = Math.min(size - 1, x + 1), nextY = Math.min(size - 1, y + 1);
    const across = column - x, down = row - y;
    const upper = data[y * size + x] * (1 - across) + data[y * size + nextX] * across;
    const lower = data[nextY * size + x] * (1 - across) + data[nextY * size + nextX] * across;
    return (upper * (1 - down) + lower * down) / 255;
  }

  function sampleHeight(heights, x, y) {
    if (x < 0 || x > chartSize.width || y < 0 || y > chartSize.height) return 0;
    const u = (x - region.x) / region.span, v = (y - region.y) / region.span;
    const edge = fade(Math.min(u, v, 1 - u, 1 - v), .05);
    const weight = edge * edge * (3 - 2 * edge);
    const europe = weight < 1
      ? maxHeight * bilinear(heights.europe, atlasSize,
        x * atlasSize / chartSize.width - .5, y * atlasSize / chartSize.height - .5)
      : 0;
    const lisbon = weight > 0
      ? lisbonMaxHeight * bilinear(heights.lisbon, region.samples,
        u * (region.samples - 1), v * (region.samples - 1))
      : 0;
    return europe * (1 - weight) + lisbon * weight;
  }

  const vertexSource = precision => `
    precision highp float;
    attribute vec2 a_uv;
    uniform sampler2D u_europe, u_lisbon;
    uniform vec2 u_sourceSize, u_offset, u_center, u_translation;
    uniform vec3 u_camera;
    uniform float u_zoom, u_reliefScale;
    varying ${precision} vec2 v_uv;

    void main() {
      vec2 mapPosition = a_uv * u_sourceSize + u_offset;
      vec2 world = (mapPosition - u_translation) / u_zoom;
      vec2 chart = world / vec2(${chartSize.width}.0, ${chartSize.height}.0);
      float inChart = step(0.0, min(chart.x, chart.y)) * step(max(chart.x, chart.y), 1.0);
      float europe = texture2D(u_europe, chart).r * ${maxHeight}.0 * inChart;
      vec2 local = (world - vec2(${region.x}.0, ${region.y}.0)) / ${region.span}.0;
      vec2 edge = min(local, 1.0 - local);
      float weight = smoothstep(0.0, 0.05, min(edge.x, edge.y));
      vec2 sampleAt = (local * ${region.samples - 1}.0 + 0.5) / ${region.samples}.0;
      float lisbon = texture2D(u_lisbon, sampleAt).r * ${lisbonMaxHeight};
      float height = mix(europe, lisbon, weight) * u_zoom * u_reliefScale;
      vec2 offset = mapPosition - u_center;
      float depth = 1.0 - (offset.y * u_camera.y + height * u_camera.x) / u_camera.z;
      gl_Position = vec4(offset.x / u_center.x,
        (height * u_camera.y - offset.y * u_camera.x) / u_center.y, (depth - 1.0) * 0.25, depth);
      v_uv = a_uv;
    }`;

  const fragmentSource = precision => `
    precision ${precision} float;
    uniform sampler2D u_color;
    varying ${precision} vec2 v_uv;
    void main() {
      gl_FragColor = texture2D(u_color, v_uv);
    }`;

  function createMesh(gl, position) {
    const divisions = 192;
    const rowSize = divisions + 1;
    const coordinates = new Float32Array(rowSize ** 2 * 2);
    const indices = new Uint16Array(divisions ** 2 * 6);
    for (let y = 0; y < rowSize; y++) {
      for (let x = 0; x < rowSize; x++) {
        const vertex = y * rowSize + x;
        coordinates.set([x / divisions, y / divisions], vertex * 2);
        if (x === divisions || y === divisions) continue;
        const next = vertex + rowSize;
        indices.set([vertex, next, vertex + 1, vertex + 1, next, next + 1], (y * divisions + x) * 6);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, coordinates, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return indices.length;
  }

  function renderer(canvas, heights) {
    const gl = canvas.getContext('webgl', {alpha: false, antialias: false});
    if (!gl || gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 2 ||
        gl.getParameter(gl.MAX_TEXTURE_SIZE) < atlasSize) return null;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }

    function texture(unit) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision ? 'highp' : 'mediump';
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource(precision)));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource(precision)));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const count = createMesh(gl, gl.getAttribLocation(program, 'a_uv'));
    const uniform = name => gl.getUniformLocation(program, 'u_' + name);
    const sourceSize = uniform('sourceSize'), offset = uniform('offset'), center = uniform('center');
    const translation = uniform('translation'), camera = uniform('camera'), scale = uniform('zoom'), heightScale = uniform('reliefScale');

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    function uploadHeight(unit, name, size, data) {
      texture(unit);
      gl.uniform1i(uniform(name), unit);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, size, size, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
    }
    uploadHeight(1, 'europe', atlasSize, heights.europe);
    uploadHeight(2, 'lisbon', region.samples, heights.lisbon);
    texture(0);
    gl.uniform1i(uniform('color'), 0);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(45 / 255, 85 / 255, 87 / 255, 1);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    let uploadedRevision = -1;
    let textureUploads = 0;
    return {
      get textureUploads() { return textureUploads; },
      maxTextureSize,
      draw(source, view, rect, ratio, revision) {
        if (gl.isContextLost()) return false;
        const {projection: {cx, cy, cos, sin, focal, reliefScale}, tx, ty, zoom, w, h} = view;
        const width = Math.round(w * ratio), height = Math.round(h * ratio);
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (uploadedRevision !== revision) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
          uploadedRevision = revision;
          textureUploads++;
        }
        gl.uniform2f(sourceSize, rect.width, rect.height);
        gl.uniform2f(offset, rect.left, rect.top);
        gl.uniform2f(center, cx, cy);
        gl.uniform2f(translation, tx, ty);
        gl.uniform3f(camera, cos, sin, focal);
        gl.uniform1f(scale, zoom);
        gl.uniform1f(heightScale, reliefScale);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        return true;
      }
    };
  }

  window.ROTTA_EUROPE_PITCH = {project, sourceRect, maxAngle, loadHeights, sampleHeight, renderer};
})();

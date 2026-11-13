(() => {
  const region = {x: 4480, y: 13312, span: 768, samples: 385};
  const maxAngle = 48;
  const heightScale = .0135;
  const fade = (distance, width) => Math.max(0, Math.min(1, distance / width));

  function coverage(x, y, zoom) {
    const dx = x - region.x, dy = y - region.y;
    return fade(Math.min(dx, dy, region.span - dx, region.span - dy), 56) * fade(zoom - 1, 1);
  }

  function project(w, h, degrees) {
    const radians = degrees * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const cx = w / 2, cy = h / 2, focal = Math.max(w, h) * 1.35;
    const matrix = `matrix3d(1,0,0,0,0,${cos},0,${-sin / focal},0,0,1,0,0,0,0,1)`;
    return {
      degrees, cx, cy, cos, sin, focal,
      apply(x, y, height = 0) {
        const v = y - cy, depth = 1 - (v * sin + height * cos) / focal;
        if (depth <= 0) return {x: Infinity, y: Infinity};
        return {x: cx + (x - cx) / depth, y: cy + (v * cos - height * sin) / depth};
      },
      invert(x, y) {
        const v = (y - cy) / (cos + (y - cy) * sin / focal);
        return {x: cx + (x - cx) * (1 - v * sin / focal), y: cy + v};
      },
      transform(x, y) {
        return `translate3d(${cx}px,${cy}px,0) ${matrix} translate3d(${x - cx}px,${y - cy}px,0)`;
      }
    };
  }

  function sourceRect(projection, zoom) {
    const {cx, cy} = projection;
    const corners = [projection.invert(0, 0), projection.invert(2 * cx, 0),
      projection.invert(0, 2 * cy), projection.invert(2 * cx, 2 * cy)];
    // Include extra land below the viewport for terrain elevated into view.
    const pad = Math.ceil(1020 * heightScale * zoom);
    const left = Math.floor(Math.min(...corners.map(point => point.x))) - pad;
    const top = Math.floor(Math.min(...corners.map(point => point.y)));
    const right = Math.ceil(Math.max(...corners.map(point => point.x))) + pad;
    const bottom = Math.ceil(Math.max(...corners.map(point => point.y))) + pad * 2;
    return {left, top, width: right - left, height: bottom - top};
  }

  function loadHeights() {
    return fetch('assets/europe/terrain/lisbon-elevation.bin?v=1', {cache: 'force-cache'}).then(async response => {
      if (!response.ok) throw new Error(`Lisbon elevation: ${response.status}`);
      const heights = new Uint8Array(await response.arrayBuffer());
      if (heights.length !== region.samples ** 2) throw new Error('Invalid Lisbon elevation dimensions');
      return heights;
    });
  }

  function sampleHeight(heights, x, y) {
    const u = (x - region.x) / region.span, v = (y - region.y) / region.span;
    const edge = fade(Math.min(u, v, 1 - u, 1 - v), .05);
    if (!edge) return 0;
    const last = region.samples - 1;
    const column = u * last, row = v * last;
    const left = Math.floor(column), top = Math.floor(row);
    const index = top * region.samples + left;
    const across = column - left, down = row - top;
    const upper = heights[index] * (1 - across) + heights[index + 1] * across;
    const lower = heights[index + region.samples] * (1 - across) + heights[index + region.samples + 1] * across;
    return (upper * (1 - down) + lower * down) * (1020 * heightScale / 255) * edge * edge * (3 - 2 * edge);
  }

  const vertexSource = precision => `
    precision highp float;
    attribute vec2 a_uv;
    uniform sampler2D u_height;
    uniform vec2 u_sourceSize, u_offset, u_center, u_translation;
    uniform vec3 u_camera;
    uniform float u_zoom;
    varying ${precision} vec2 v_uv;

    void main() {
      vec2 mapPosition = a_uv * u_sourceSize + u_offset;
      vec2 world = (mapPosition - u_translation) / u_zoom;
      vec2 local = (world - vec2(${region.x}.0, ${region.y}.0)) / ${region.span}.0;
      vec2 edge = min(local, 1.0 - local);
      float weight = smoothstep(0.0, 0.05, min(edge.x, edge.y));
      vec2 sampleAt = (local * ${region.samples - 1}.0 + 0.5) / ${region.samples}.0;
      float height = texture2D(u_height, sampleAt).r * ${1020 * heightScale} * u_zoom * weight;
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
    if (!gl || gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) return null;

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
    const translation = uniform('translation'), camera = uniform('camera'), scale = uniform('zoom');

    texture(1);
    gl.uniform1i(uniform('height'), 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, region.samples, region.samples, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE, heights);
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
        const {projection: {cx, cy, cos, sin, focal}, tx, ty, zoom, w, h} = view;
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
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        return true;
      }
    };
  }

  window.ROTTA_EUROPE_PITCH = {coverage, project, sourceRect, maxAngle, loadHeights, sampleHeight, renderer};
})();

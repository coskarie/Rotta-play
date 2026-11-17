(() => {
  const region = {x: 4480, y: 13312, span: 768, samples: 385};
  const maxAngle = 48;
  const maxBendSquared = 4;
  const atlasSize = 4096;
  const waveNoiseSize = 128;
  const chartSize = {width: 16384, height: 17192};
  const maxHeight = 32;
  const heightExaggeration = 2;
  const lisbonMaxHeight = 1020 * .0135;
  const fade = (distance, width) => Math.max(0, Math.min(1, distance / width));

  function project(w, h, degrees, zoom = 1) {
    const radians = degrees * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const cx = w / 2, cy = h / 2;
    const lift = fade(degrees, 12);
    const reliefScale = heightExaggeration * lift * lift * (3 - 2 * lift);
    // Keep the camera above the highest terrain at close zoom on small screens.
    const highest = maxHeight * zoom * reliefScale;
    const focal = Math.max(Math.max(w, h) * 1.35, highest / (.9 * cos));
    const bendProgress = fade(degrees - 10, maxAngle - 10);
    const edgeDrop = Math.min(w, h) * .072 * bendProgress ** 2 * (3 - 2 * bendProgress);
    const bend = x => edgeDrop * Math.min(((x - cx) / cx) ** 2, maxBendSquared);
    const matrix = `matrix3d(1,0,0,0,0,${cos},0,${-sin / focal},0,0,1,0,0,0,0,1)`;
    return {
      degrees, zoom, cx, cy, cos, sin, focal, reliefScale, edgeDrop, bend,
      apply(x, y, height = 0, curved = true) {
        const v = y - cy, depth = 1 - (v * sin + height * cos) / focal;
        if (depth <= 0) return {x: Infinity, y: Infinity};
        const screenX = cx + (x - cx) / depth;
        const screenY = cy + (v * cos - height * sin) / depth;
        return {x: screenX, y: screenY + (curved ? bend(screenX) : 0)};
      },
      invert(x, y, height = 0, curved = true) {
        const screenY = y - cy - (curved ? bend(x) : 0);
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
    // The top edge reaches farther at the sides and the bottom reaches farther at the center.
    const corners = [0, highest].flatMap(height => [0, cx].flatMap(x =>
      [0, 2 * cy].map(y => projection.invert(x, y, height))));
    const left = Math.floor(Math.min(...corners.map(point => point.x)));
    const right = Math.ceil(2 * cx - left);
    const top = Math.floor(Math.min(...corners.map(point => point.y)));
    const bottom = Math.ceil(Math.max(...corners.map(point => point.y)));
    return {left, top, width: right - left, height: bottom - top};
  }

  async function loadTerrainBytes(file, expected, compressed = false) {
    const response = await fetch('assets/europe/terrain/' + file, {cache: 'force-cache'});
    if (!response.ok) throw new Error(`Terrain data ${file}: ${response.status}`);
    const bytes = compressed
      ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
      : await response.arrayBuffer();
    if (bytes.byteLength !== expected) throw new Error(`Invalid terrain data dimensions: ${file}`);
    return new Uint8Array(bytes);
  }

  async function loadHeights() {
    const [europe, lisbon] = await Promise.all([
      loadTerrainBytes('europe-elevation-v1.bin.gz', atlasSize ** 2, true),
      loadTerrainBytes('lisbon-elevation.bin?v=1', region.samples ** 2)
    ]);
    return {europe, lisbon};
  }

  function loadShore() {
    return loadTerrainBytes('water-shore-v2.bin.gz', atlasSize ** 2, true);
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

  const elevationSource = `
    uniform sampler2D u_europe, u_lisbon;

    vec3 readElevation(vec2 chart) {
      float inChart = step(0.0, min(chart.x, chart.y)) * step(max(chart.x, chart.y), 1.0);
      float europe = texture2D(u_europe, chart).r * ${maxHeight}.0 * inChart;
      vec2 local = (chart * vec2(${chartSize.width}.0, ${chartSize.height}.0)
        - vec2(${region.x}.0, ${region.y}.0)) / ${region.span}.0;
      vec2 edge = min(local, 1.0 - local);
      float weight = smoothstep(0.0, 0.05, min(edge.x, edge.y));
      vec2 sampleAt = (local * ${region.samples - 1}.0 + 0.5) / ${region.samples}.0;
      float lisbon = texture2D(u_lisbon, sampleAt).r * ${lisbonMaxHeight};
      return vec3(europe, lisbon, weight);
    }
  `;

  const vertexSource = precision => `
    precision highp float;
    attribute vec2 a_uv;
    uniform vec2 u_sourceSize, u_offset, u_translation, u_center;
    uniform vec3 u_camera;
    uniform float u_zoom, u_reliefScale, u_edgeDrop;
    varying ${precision} vec2 v_uv, v_chart;
    ${elevationSource}

    void main() {
      vec2 mapPosition = a_uv * u_sourceSize + u_offset;
      vec2 world = (mapPosition - u_translation) / u_zoom;
      vec2 chart = world / vec2(${chartSize.width}.0, ${chartSize.height}.0);
      float height = 0.0;
      if (u_reliefScale > 0.0) {
        vec3 samples = readElevation(chart);
        height = mix(samples.x, samples.y, samples.z) * u_zoom * u_reliefScale;
      }
      vec2 offset = mapPosition - u_center;
      float depth = 1.0 - (offset.y * u_camera.y + height * u_camera.x) / u_camera.z;
      float clipX = offset.x / u_center.x;
      float screenX = clipX / max(depth, 0.0001);
      float bend = u_edgeDrop * min(screenX * screenX, ${maxBendSquared}.0);
      float clipY = (height * u_camera.y - offset.y * u_camera.x) / u_center.y - bend * depth;
      gl_Position = vec4(clipX, clipY, (depth - 1.0) * 0.25, depth);
      v_uv = a_uv;
      v_chart = chart;
    }`;

  const waterSource = `
    uniform sampler2D u_shore, u_waveNoise;
    uniform bool u_waterReady;
    uniform float u_waterTime, u_waterDetail;
    uniform vec2 u_worldToSource;

    float waterTone(vec3 color) {
      return smoothstep(0.008, 0.085, min(color.b, color.g) - color.r);
    }

    vec2 wavelet(vec2 grid, vec2 seed) {
      vec2 cell = floor(grid);
      vec4 random = texture2D(u_waveNoise, (cell + seed + 0.5) / ${waveNoiseSize}.0);
      vec2 local = fract(grid) - 0.5;
      float fadeEdge = 1.0 - smoothstep(0.32, 0.5, max(abs(local.x), abs(local.y)));
      local -= (random.xy - 0.5) * vec2(0.39, 0.31);
      float angle = (random.z - 0.5) * 1.37;
      float halfLength = mix(0.13, 0.46, random.w);
      float along = (local.x + local.y * angle) / halfLength;
      float across = local.y - local.x * angle;
      // Most crests are nearly straight; a few have a stronger signed arc.
      float curve = (random.y * 2.0 - 1.0) * random.z * random.z * 0.28;
      float line = curve * along * along + (random.x - 0.5) * 0.06 * along * along * along;
      float speed = 8.0 + floor(random.x * 9.0);
      float age = fract(u_waterTime * speed / 6.2831853 + random.w);
      float life = smoothstep(0.04, 0.27, age) * (1.0 - smoothstep(0.65, 1.0, age));
      float ridge = across - line - mix(-0.17, 0.20, age);
      float shape = (1.0 - smoothstep(0.42, 1.0, abs(along))) * fadeEdge * life;
      float cap = (1.0 - smoothstep(0.012, 0.049 + random.x * 0.045, abs(ridge))) * shape;
      float body = (1.0 - smoothstep(0.035, 0.14, abs(ridge + 0.035))) * shape;
      return vec2(cap, body) * mix(0.52, 1.0, random.y);
    }

    float shorePulse(float distance, vec2 world, float noise) {
      float phase = distance * 2.0 + u_waterTime * 17.0 + noise * 3.2 + dot(world, vec2(0.08, -0.04));
      return smoothstep(0.24, 0.96, cos(phase));
    }

    vec3 coastalWash(vec3 base, float distance, vec2 world, float tone) {
      float detail = smoothstep(0.10, 0.78, u_waterDetail);
      if (detail <= 0.0 || abs(distance) > 4.4 || tone > 0.94) return base;
      float grain = texture2D(u_waveNoise, world * vec2(0.0022, 0.0036)).g;
      float pulse = shorePulse(distance, world, grain);
      vec2 reach = u_worldToSource * (0.57 + (0.39 + 0.53 * grain) * pulse);
      // Read the painted coastline to let the wash cross its edge by only a small amount.
      float adjacent = max(
        max(waterTone(texture2D(u_color, v_uv + vec2(reach.x, 0.0)).rgb),
            waterTone(texture2D(u_color, v_uv - vec2(reach.x, 0.0)).rgb)),
        max(waterTone(texture2D(u_color, v_uv + vec2(0.0, reach.y)).rgb),
            waterTone(texture2D(u_color, v_uv - vec2(0.0, reach.y)).rgb)));
      float damp = smoothstep(0.23, 0.81, adjacent) * (1.0 - tone) * detail;
      damp *= 1.0 - smoothstep(2.1, 4.4, abs(distance));
      vec3 wetSand = base * vec3(0.80, 0.88, 0.90);
      vec3 wash = mix(wetSand, vec3(0.67, 0.77, 0.73), pulse * smoothstep(0.30, 0.79, grain) * 0.27);
      return mix(base, wash, damp * (0.68 + 0.26 * pulse));
    }

    vec3 waterSurface(vec3 base, float distance, vec2 world) {
      float t = u_waterTime;
      vec2 drift = vec2(cos(t), sin(t)) * 0.012;
      vec4 sky = texture2D(u_waveNoise, world * vec2(0.00043, 0.00070) + drift);
      float broad = sky.r - 0.5;
      vec2 longGrid = vec2(world.x + 0.11 * world.y, world.y) / vec2(18.0, 8.2);
      vec2 smallGrid = vec2(world.x - 0.32 * world.y, world.y + 0.06 * world.x) / vec2(9.8, 4.9);
      vec2 longWaves = wavelet(longGrid + sky.gb * 0.27, vec2(0.0));
      vec2 smallWaves = wavelet(smallGrid + vec2(0.37, 0.63), vec2(37.0, 59.0));
      float glint = longWaves.x * 0.48 + smallWaves.x * 0.59 * u_waterDetail;
      float crest = longWaves.y * 0.67 + smallWaves.y * 0.33 * u_waterDetail;

      vec3 sea = base * vec3(0.92, 0.96, 0.99);
      sea += broad * vec3(0.043, 0.063, 0.069);
      sea += crest * vec3(0.042, 0.063, 0.075);
      sea += glint * vec3(0.105, 0.157, 0.176);
      float shallows = 1.0 - smoothstep(0.0, 15.0, distance);
      sea += shallows * vec3(0.015, 0.054, 0.046);

      float nearShore = smoothstep(-0.45, 0.84, distance) * (1.0 - smoothstep(1.4, 3.25, distance));
      float patches = texture2D(u_waveNoise, world * vec2(0.0022, 0.0036)).g;
      float foam = nearShore * shorePulse(distance, world, patches) * smoothstep(0.29, 0.83, patches);
      return mix(sea, vec3(0.70, 0.83, 0.80), foam * u_waterDetail * 0.39);
    }
  `;

  const fragmentSource = precision => `
    precision ${precision} float;
    uniform sampler2D u_color;
    varying ${precision} vec2 v_uv, v_chart;
    ${elevationSource}
    ${waterSource}

    void main() {
      vec4 terrain = texture2D(u_color, v_uv);
      if (u_waterReady) {
        float distance = texture2D(u_shore, v_chart).r * 31.875 - 8.0;
        if (min(v_chart.x, v_chart.y) < 0.0 || max(v_chart.x, v_chart.y) > 1.0) distance = 23.875;
        vec2 world = v_chart * vec2(${chartSize.width}.0, ${chartSize.height}.0);
        float tone = waterTone(terrain.rgb);
        float wet = smoothstep(-1.3, 1.35, distance) * tone;
        vec3 edge = coastalWash(terrain.rgb, distance, world, tone);
        if (wet > 0.0) {
          gl_FragColor = vec4(mix(edge, waterSurface(terrain.rgb, distance, world), wet), terrain.a);
          return;
        }
        terrain.rgb = edge;
      }
      vec3 samples = readElevation(v_chart);
      // Undo the atlas' display compression to place vegetation bands in metres.
      float europeMetres = samples.x * 2200.0 / (35.2 - samples.x);
      float metres = mix(europeMetres, samples.y / 0.0135, samples.z);
      // Northern mountains lose vegetation at lower elevations.
      float south = smoothstep(0.20, 0.75, v_chart.y);
      float dryStart = mix(375.0, 900.0, south);
      float rockStart = mix(840.0, 1720.0, south);
      float dry = smoothstep(dryStart, dryStart + mix(420.0, 680.0, south), metres);
      float rock = smoothstep(rockStart, rockStart + mix(680.0, 950.0, south), metres);

      // Tint the existing texture while keeping its shadows and fine detail.
      float light = dot(terrain.rgb, vec3(0.27, 0.60, 0.13));
      vec3 dryGrass = light * vec3(1.20, 1.04, 0.78);
      vec3 stone = (light * 0.89 + 0.075) * vec3(1.045, 1.015, 0.99);
      vec3 color = mix(terrain.rgb, dryGrass, dry * 0.86);
      gl_FragColor = vec4(mix(color, stone, rock * 0.96), terrain.a);
    }`;

  function createMesh(gl, position) {
    const divisions = 192;
    const rowSize = divisions + 1;
    const coordinates = new Float32Array(rowSize ** 2 * 2);
    const count = divisions ** 2 * 6;
    const indices = new Uint16Array(count + 4);
    for (let y = 0; y < rowSize; y++) {
      for (let x = 0; x < rowSize; x++) {
        const vertex = y * rowSize + x;
        coordinates.set([x / divisions, y / divisions], vertex * 2);
        if (x === divisions || y === divisions) continue;
        const next = vertex + rowSize;
        indices.set([vertex, next, vertex + 1, vertex + 1, next, next + 1], (y * divisions + x) * 6);
      }
    }
    // Reuse the grid corners for the flat map, which only needs two triangles.
    indices.set([0, rowSize * divisions, divisions, rowSize ** 2 - 1], count);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, coordinates, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return count;
  }

  function waveNoise() {
    const noise = new Uint8Array(waveNoiseSize ** 2 * 4);
    let seed = 1543;
    for (let i = 0; i < noise.length; i++) {
      seed = Math.imul(1664525, seed) + 1013904223;
      noise[i] = seed >>> 24;
    }
    return noise;
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

    const edgeDropUniform = uniform('edgeDrop');
    const waterReadyUniform = uniform('waterReady'), waterTime = uniform('waterTime'), waterDetail = uniform('waterDetail');
    const worldToSource = uniform('worldToSource');

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    function uploadBytes(unit, name, size, data, format = gl.LUMINANCE) {
      texture(unit);
      gl.uniform1i(uniform(name), unit);
      gl.texImage2D(gl.TEXTURE_2D, 0, format, size, size, 0, format, gl.UNSIGNED_BYTE, data);
    }
    uploadBytes(1, 'europe', atlasSize, heights.europe);
    uploadBytes(2, 'lisbon', region.samples, heights.lisbon);
    uploadBytes(3, 'shore', 1, new Uint8Array(1));
    uploadBytes(4, 'waveNoise', waveNoiseSize, waveNoise(), gl.RGBA);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    texture(0);
    gl.uniform1i(uniform('color'), 0);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(45 / 255, 85 / 255, 87 / 255, 1);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    let uploadedRevision = -1;
    let textureUploads = 0;
    let hasWater = false;
    return {
      get hasWater() { return hasWater; },
      setShore(data) {
        gl.activeTexture(gl.TEXTURE3);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, atlasSize, atlasSize, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
        gl.activeTexture(gl.TEXTURE0);
        hasWater = true;
      },
      get textureUploads() { return textureUploads; },
      maxTextureSize,
      draw(source, view, rect, ratio, revision, waterPhase = 0) {
        if (gl.isContextLost()) return false;
        const {projection: {cx, cy, cos, sin, focal, reliefScale, edgeDrop}, tx, ty, zoom, w, h} = view;
        const width = Math.round(w * ratio), height = Math.round(h * ratio);
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        if (canvas.style.width !== w + 'px') canvas.style.width = w + 'px';
        if (canvas.style.height !== h + 'px') canvas.style.height = h + 'px';
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
        gl.uniform1f(edgeDropUniform, edgeDrop / cy);
        gl.uniform1i(waterReadyUniform, hasWater);
        gl.uniform1f(waterTime, waterPhase);
        gl.uniform1f(waterDetail, fade(zoom - 1.25, 3.25));
        gl.uniform2f(worldToSource, zoom / rect.width, zoom / rect.height);
        if (reliefScale) gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        else gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, count * 2);
        return true;
      }
    };
  }

  window.ROTTA_EUROPE_PITCH = {project, sourceRect, maxAngle, loadHeights, loadShore, sampleHeight, renderer};
})();

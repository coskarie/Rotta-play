(() => {
  const region = {x: 4480, y: 13312, span: 768, samples: 385};
  const maxAngle = 48;
  const maxBendSquared = 4;
  const atlasSize = 4096;
  const waveNoiseSize = 128;
  const surfaceNormalSize = 64;
  const waveFlowSize = 1024;
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

  function loadWater() {
    return Promise.all([
      loadTerrainBytes('water-shore-v2.bin.gz', atlasSize ** 2, true),
      loadTerrainBytes('wave-flow-v2.bin.gz', waveFlowSize ** 2 * 4, true),
      loadTerrainBytes('wave-cross-v1.bin.gz', waveFlowSize ** 2 * 2, true)
    ]);
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
    uniform sampler2D u_shore, u_waveNoise, u_surfaceNormals;
    uniform bool u_waterReady;
    uniform float u_waterTime, u_waterDetail, u_waterTilt;
    uniform vec2 u_worldToSource;

    float waterTone(vec3 color) {
      return smoothstep(0.008, 0.085, min(color.b, color.g) - color.r);
    }

    vec4 flowTexel(vec2 uv) {
      vec4 field = texture2D(u_waveFlow, uv);
      const vec2 unpack = vec2(16320.0, 63.75);
      float along = dot(field.ba, unpack);
      float across = dot(texture2D(u_waveCross, uv).ra, unpack);
      return vec4(field.rg * 2.0 - 1.0, along - 8192.0, across - 8192.0);
    }

    vec4 waveFlow(vec2 world, bool inChart) {
      vec2 prevailing = vec2(0.86, -0.51);
      vec2 coordinates = vec2(dot(world, prevailing), dot(world, vec2(-prevailing.y, prevailing.x)));
      if (!inChart) return vec4(prevailing, coordinates);
      const float size = ${waveFlowSize}.0;
      const vec2 stepUV = vec2(1.0 / size, 0.0);
      vec2 pixel = clamp(v_chart * size - 0.5, 0.0, size - 1.0);
      vec2 uv = (floor(pixel) + 0.5) / size;
      vec2 fraction = fract(pixel);
      // Unpack before interpolating. Filtering the bytes could round across a high-byte carry.
      vec4 upper = mix(flowTexel(uv), flowTexel(uv + stepUV.xy), fraction.x);
      vec4 lower = mix(flowTexel(uv + stepUV.yx), flowTexel(uv + stepUV.xx), fraction.x);
      vec4 field = mix(upper, lower, fraction.y);
      return vec4(normalize(field.xy), coordinates + field.zw);
    }

    vec3 coastFlow(vec2 direction, float distance) {
      if (abs(distance) > 10.0) return vec3(direction, 0.0);
      vec2 stepUV = vec2(1.0 / ${atlasSize}.0, 0.0);
      vec2 gradient = vec2(
        texture2D(u_shore, v_chart + stepUV.xy).r - texture2D(u_shore, v_chart - stepUV.xy).r,
        texture2D(u_shore, v_chart + stepUV.yx).r - texture2D(u_shore, v_chart - stepUV.yx).r
      ) * vec2(1.0, ${chartSize.width}.0 / ${chartSize.height}.0);
      if (dot(gradient, gradient) < 0.0001) return vec3(direction, 0.38);
      vec2 shoreward = -normalize(gradient);
      float exposure = mix(0.12, 1.0, smoothstep(-0.10, 0.82, dot(direction, shoreward)));
      float turn = (1.0 - smoothstep(1.0, 10.0, abs(distance))) * exposure * 0.59;
      return vec3(normalize(mix(direction, shoreward, turn)), exposure);
    }

    // The paired coordinates turn with a channel. Each component has its own direction and pace.
    const vec2 swellA = vec2(0.30, 0.0);
    const vec2 swellB = vec2(0.36, 0.24);
    const vec2 swellC = vec2(0.46, -0.30);

    vec3 swellPhase(vec2 coordinates) {
      return vec3(dot(coordinates, swellA), dot(coordinates, swellB), dot(coordinates, swellC))
        - u_waterTime * vec3(13.0, 17.0, 23.0);
    }

    float shoreGrain(vec2 world) {
      float cycle = u_waterTime / 6.2831853;
      float folds = texture2D(u_waveNoise, world * vec2(0.0014, 0.0020) + vec2(-1.0, 1.0) * cycle).g;
      float lace = texture2D(u_waveNoise, world * vec2(0.0038, 0.0051) + vec2(2.0, 1.0) * cycle).b;
      return folds * 0.66 + lace * 0.34;
    }

    float shorePulse(float distance, vec3 phase, float grain, float exposure) {
      // Slower wave crests near shore turn toward the beach.
      vec3 approach = phase - distance * (0.27 + 0.45 * exposure) * vec3(1.0, 0.88, 0.75);
      vec3 peaks = cos(approach + (grain - 0.5) * 0.85);
      return smoothstep(0.08, 0.77, dot(peaks, vec3(0.59, 0.25, 0.16)));
    }

    vec2 rippleNormal(vec2 coordinates) {
      float cycle = u_waterTime / 6.2831853;
      vec2 coarse = texture2D(u_surfaceNormals, coordinates * 0.0038 + vec2(-1.0, 0.0)*cycle).ra - 0.5;
      vec2 shifted = vec2(coordinates.x * 0.78 + coordinates.y * 0.62, coordinates.y * 0.78 - coordinates.x * 0.62);
      vec2 medium = texture2D(u_surfaceNormals, shifted * 0.0084 + vec2(-1.0, 1.0)*cycle + 0.37).ra - 0.5;
      vec2 normal = coarse * 0.48 + vec2(medium.x*0.78-medium.y*0.62, medium.x*0.62+medium.y*0.78) * 0.39;
      if (u_waterDetail > 0.0) {
        vec2 fine = texture2D(u_surfaceNormals, coordinates * 0.019 + vec2(-2.0, -1.0)*cycle + 0.18).ra - 0.5;
        normal += fine * 0.32 * u_waterDetail;
      }
      return normal;
    }

    float shortReflection(vec2 world, vec2 flow) {
      vec2 grid = world / 9.0;
      vec4 seed = texture2D(u_waveNoise, (floor(grid) + 0.5) / ${waveNoiseSize}.0);
      vec2 local = fract(grid) - 0.5;
      float cellFade = 1.0 - smoothstep(0.34, 0.5, max(abs(local.x), abs(local.y)));
      local -= (seed.rg - 0.5) * 0.26;
      float along = dot(local, vec2(-flow.y, flow.x));
      float cross = dot(local, flow);
      float halfLength = mix(0.15, 0.39, seed.w);
      float lengthPosition = along / halfLength;
      float age = fract(u_waterTime * (10.0 + floor(seed.b * 7.0)) / 6.2831853 + seed.r);
      float life = smoothstep(0.08, 0.35, age) * (1.0 - smoothstep(0.65, 1.0, age));
      float bend = (seed.g - 0.5) * (lengthPosition * lengthPosition * 0.20 + along * 0.65);
      float ridge = cross - bend - mix(-0.15, 0.18, age);
      float trace = 1.0 - smoothstep(0.014, 0.055, abs(ridge));
      return trace * (1.0 - smoothstep(0.45, 1.0, abs(lengthPosition))) * life * cellFade;
    }

    vec3 coastalWash(vec3 base, float distance, vec2 world, float tone, vec3 phase, float exposure) {
      float detail = 0.23 + 0.77 * smoothstep(0.08, 0.78, u_waterDetail);
      if (abs(distance) > 4.4 || tone > 0.94) return base;
      float grain = shoreGrain(world);
      float pulse = shorePulse(distance, phase, grain, exposure);
      vec2 reach = u_worldToSource * (0.51 + (0.39 + 0.53 * grain) * pulse * exposure);
      // Read the painted coastline to let the wash cross its edge by only a small amount.
      float adjacent = max(
        max(waterTone(texture2D(u_color, v_uv + vec2(reach.x, 0.0)).rgb),
            waterTone(texture2D(u_color, v_uv - vec2(reach.x, 0.0)).rgb)),
        max(waterTone(texture2D(u_color, v_uv + vec2(0.0, reach.y)).rgb),
            waterTone(texture2D(u_color, v_uv - vec2(0.0, reach.y)).rgb)));
      float damp = smoothstep(0.23, 0.81, adjacent) * (1.0 - tone) * detail;
      damp *= 1.0 - smoothstep(2.1, 4.4, abs(distance));
      vec3 wetSand = base * vec3(0.80, 0.88, 0.90);
      vec3 wash = mix(wetSand, vec3(0.67, 0.77, 0.73), pulse * smoothstep(0.30, 0.79, grain) * exposure * 0.27);
      return mix(base, wash, damp * (0.46 + exposure * (0.23 + 0.27 * pulse)));
    }

    vec3 waterSurface(vec3 base, float distance, vec2 world, vec3 localFlow, vec3 phase, vec2 coordinates) {
      vec2 drift = vec2(cos(u_waterTime), sin(u_waterTime)) * 0.012;
      vec4 gusts = texture2D(u_waveNoise, world * vec2(0.00029, 0.00037) - drift*0.6);
      vec4 lightPatches = texture2D(u_waveNoise, world * vec2(0.00073, 0.00108) + drift);
      float approach = 1.0 - smoothstep(2.0, 10.0, abs(distance));
      vec3 refracted = phase - distance * approach * localFlow.z * vec3(0.58, 0.49, 0.42);
      // Uneven winds shift the crests and the strength of each swell on distinct scales.
      refracted += (gusts.rgb - 0.5) * vec3(3.7, 4.1, 4.5) + (lightPatches.rgb - 0.5) * 1.45;
      vec3 peaks = cos(refracted);
      vec3 slopes = sin(refracted) * vec3(0.50, 0.44, 0.40) * (0.53 + gusts.gbr);
      vec2 gradient = swellA*slopes.x + swellB*slopes.y + swellC*slopes.z;
      gradient += rippleNormal(coordinates);
      vec2 side = vec2(-localFlow.y, localFlow.x);
      vec3 normal = normalize(vec3(localFlow.xy * gradient.x + side * gradient.y, 1.0));

      vec3 glancingLight = normalize(vec3(-0.30, -0.16 + u_waterTilt*0.30, 1.0));
      float facing = max(0.0, dot(normal, glancingLight));
      float reflected = smoothstep(0.92, 0.999, facing);
      float glint = pow(facing, 47.0) * smoothstep(0.43, 0.87, lightPatches.b)
        * (0.28 + 0.72 * smoothstep(0.20, 0.83, gusts.a));
      float swell = dot(peaks, vec3(0.40, 0.34, 0.26));

      vec3 sea = base * vec3(0.93, 0.97, 0.99);
      sea += (lightPatches.r - 0.5) * vec3(0.029, 0.046, 0.054);
      sea += swell * vec3(0.010, 0.018, 0.023);
      sea += reflected * vec3(0.013, 0.023, 0.030);
      sea += glint * vec3(0.038, 0.061, 0.073);
      if (u_waterDetail > 0.0) {
        float gleam = shortReflection(world, localFlow.xy)
          * (0.36 + 0.64 * smoothstep(0.34, 0.8, lightPatches.g));
        sea += gleam * vec3(0.035, 0.078, 0.086) * u_waterDetail;
      }
      float shallows = 1.0 - smoothstep(0.0, 15.0, distance);
      sea += shallows * vec3(0.015, 0.052, 0.045);

      if (distance >= 3.25) return sea;
      float nearShore = smoothstep(-0.45, 0.84, distance) * (1.0 - smoothstep(1.4, 3.25, distance));
      float grain = shoreGrain(world);
      float foam = nearShore * shorePulse(distance, phase, grain, localFlow.z)
        * smoothstep(0.25, 0.80, grain) * localFlow.z;
      return mix(sea, vec3(0.70, 0.83, 0.80), foam * mix(0.14, 0.39, u_waterDetail));
    }
  `;

  const fragmentSource = precision => `
    precision ${precision} float;
    uniform sampler2D u_color, u_waterEffect;
    uniform bool u_waterReady;
    varying ${precision} vec2 v_uv, v_chart;
    ${elevationSource}

    void main() {
      vec4 terrain = texture2D(u_color, v_uv);
      float seaCoverage=smoothstep(0.008,0.085,min(terrain.g,terrain.b)-terrain.r);
      if(u_waterReady&&seaCoverage>=0.9999){
        // Open-water fragments need neither elevation lookups nor vegetation/rock shading.
        gl_FragColor=vec4(terrain.rgb+texture2D(u_waterEffect,v_uv).rgb-128.0/255.0,terrain.a);
        return;
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
      vec3 painted = mix(color, stone, rock * 0.96);
      if(u_waterReady&&seaCoverage>0.0){
        // Clip the upsampled effect with the original full-resolution coastline.
        painted+=(texture2D(u_waterEffect,v_uv).rgb-128.0/255.0)*seaCoverage;
      }
      gl_FragColor = vec4(painted, terrain.a);
    }`;

  const waterVertexSource = precision => `
    precision highp float;
    attribute vec2 a_uv;
    uniform vec2 u_waterOrigin, u_waterSpan;
    varying ${precision} vec2 v_uv, v_chart;
    void main() {
      v_uv = a_uv;
      v_chart = u_waterOrigin + a_uv * u_waterSpan;
      gl_Position = vec4(a_uv * 2.0 - 1.0, 0.0, 1.0);
    }`;

  const waterFragmentSource = precision => `
    precision ${precision} float;
    uniform sampler2D u_color;
    uniform ${precision} sampler2D u_waveFlow, u_waveCross;
    varying ${precision} vec2 v_uv, v_chart;
    ${waterSource}

    void main() {
      vec3 terrain = texture2D(u_color, v_uv).rgb;
      vec3 color = terrain;
      bool inChart = min(v_chart.x, v_chart.y) >= 0.0 && max(v_chart.x, v_chart.y) <= 1.0;
      float distance = inChart ? texture2D(u_shore, v_chart).r * 31.875 - 8.0 : 23.875;
      float tone = waterTone(terrain);
      float wet = smoothstep(-1.3, 1.35, distance) * tone;
      if (wet > 0.0 || abs(distance) <= 4.4) {
        vec2 world = v_chart * vec2(${chartSize.width}.0, ${chartSize.height}.0);
        vec4 flow=waveFlow(world,inChart);
        vec3 localFlow=coastFlow(flow.xy,distance);
        vec3 phase=swellPhase(flow.zw);
        vec3 edge=coastalWash(terrain,distance,world,tone,phase,localFlow.z);
        if(wet>0.0){
          vec3 water=waterSurface(terrain,distance,world,localFlow,phase,flow.zw);
          edge=mix(edge,water,wet);
        }
        color=edge;
      }
      // Center the color difference on an exact byte so untouched land stays unchanged.
      gl_FragColor = vec4(color - terrain + 128.0 / 255.0, 1.0);
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

  function surfaceNormalPixels() {
    const waves = [
      [4, 2, .23, .7], [5, -3, .21, 2.1], [3, 7, .20, 4],
      [8, 5, .19, 4.6], [11, -4, .15, 1.5], [10, -9, .12, .6],
      [15, 3, .10, 3.4], [7, 14, .08, 5.5]
    ].map(([x, y, weight, phase]) => {
      const magnitude = Math.hypot(x, y);
      return {x, y, phase, slopeX: x*weight/magnitude, slopeY: y*weight/magnitude};
    });
    const pixels = new Uint8Array(surfaceNormalSize ** 2 * 2);
    for (let y=0; y<surfaceNormalSize; y++) for (let x=0; x<surfaceNormalSize; x++) {
      let dx=0, dy=0;
      for (const wave of waves) {
        const slope = Math.cos(2*Math.PI*(wave.x*x+wave.y*y)/surfaceNormalSize + wave.phase);
        dx += slope*wave.slopeX;
        dy += slope*wave.slopeY;
      }
      const i=(y*surfaceNormalSize+x)*2;
      pixels[i] = Math.round(127.5 + Math.max(-1,Math.min(1,dx))*127.5);
      pixels[i+1] = Math.round(127.5 + Math.max(-1,Math.min(1,dy))*127.5);
    }
    return pixels;
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
      const object = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, object);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return object;
    }

    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision ? 'highp' : 'mediump';
    function link(vertex, fragment) {
      const program = gl.createProgram();
      const vertexShader = compile(gl.VERTEX_SHADER, vertex(precision));
      const fragmentShader = compile(gl.FRAGMENT_SHADER, fragment(precision));
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.bindAttribLocation(program, 0, 'a_uv');
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      return program;
    }
    const program = link(vertexSource, fragmentSource);
    // One viewport water pass; detail no longer depends on the player's location.
    const waterProgram=link(waterVertexSource,waterFragmentSource);
    const waterNames=['waterOrigin','waterSpan','waterTime','waterDetail','worldToSource','waterTilt',
      'color','shore','waveNoise','waveFlow','waveCross','surfaceNormals'];
    const waterPass={program:waterProgram,uniforms:Object.fromEntries(waterNames.map(name=>[name,gl.getUniformLocation(waterProgram,'u_'+name)]))};
    gl.useProgram(program);
    const count = createMesh(gl, 0);
    const quadOffset = count * Uint16Array.BYTES_PER_ELEMENT;
    const uniform = name => gl.getUniformLocation(program, 'u_' + name);
    const sourceSize = uniform('sourceSize'), offset = uniform('offset'), center = uniform('center');
    const translation = uniform('translation'), camera = uniform('camera'), scale = uniform('zoom'), heightScale = uniform('reliefScale');
    const edgeDropUniform = uniform('edgeDrop'), waterReadyUniform = uniform('waterReady');

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    function uploadBytes(unit, size, data, format = gl.LUMINANCE) {
      const object = texture(unit);
      gl.texImage2D(gl.TEXTURE_2D, 0, format, size, size, 0, format, gl.UNSIGNED_BYTE, data);
      return object;
    }
    gl.uniform1i(uniform('color'), 0);
    gl.uniform1i(uniform('europe'), 1);
    gl.uniform1i(uniform('lisbon'), 2);
    gl.uniform1i(uniform('waterEffect'), 4);
    uploadBytes(1, atlasSize, heights.europe);
    uploadBytes(2, region.samples, heights.lisbon);
    const rawColor = uploadBytes(0, 1, new Uint8Array([45,85,87,255]), gl.RGBA);
    gl.useProgram(waterPass.program);
    for(const [name,unit] of [['color',0],['shore',3],['waveNoise',4],['waveFlow',5],['waveCross',6],['surfaceNormals',7]]){
      gl.uniform1i(waterPass.uniforms[name],unit);
    }
    uploadBytes(3, 1, new Uint8Array(1));
    const noiseTexture = uploadBytes(4, waveNoiseSize, waveNoise(), gl.RGBA);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    uploadBytes(5, 1, new Uint8Array([237, 62, 128, 0]), gl.RGBA);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    uploadBytes(6, 1, new Uint8Array([128, 0]), gl.LUMINANCE_ALPHA);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    uploadBytes(7, surfaceNormalSize, surfaceNormalPixels(), gl.LUMINANCE_ALPHA);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    // The expensive wave shader draws a small, flat texture. The map projects it
    // onto the same full-resolution terrain mesh as its land and coastal imagery.
    const waterEffect = uploadBytes(4, 1, new Uint8Array([128,128,128,255]), gl.RGBA);
    const waterTarget = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, waterTarget);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, waterEffect, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(45 / 255, 85 / 255, 87 / 255, 1);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    let waterWidth = 1, waterHeight = 1, waterRevision = -1, waterPassPhase, waterPassTilt;
    let waterPixelBudget=360000;
    let waterDraws = 0, waterPixels = 0;
    function renderWater(view, rect, revision, phase) {
      const tilt = Math.round(view.projection.sin * 20) / 20;
      const {width,height,left,top}=rect;
      const {zoom,tx,ty}=view;
      const overview=1-fade(zoom-1.1,2.4);
      // Reuse this phase while dragging inside the padded chart. Camera movement
      // alone must not turn the capped water animation into a new pass every frame.
      if(waterRevision===revision&&waterPassPhase===phase&&waterPassTilt===tilt)return;
      waterPixelBudget=Math.round(360000-overview*200000);
      const ratio=Math.min(.70-overview*.15,Math.sqrt(waterPixelBudget/(width*height)));
      const w = Math.max(1, Math.round(width * ratio));
      const h = Math.max(1, Math.round(height * ratio));
      gl.activeTexture(gl.TEXTURE4);
      if (w !== waterWidth || h !== waterHeight) {
        gl.bindTexture(gl.TEXTURE_2D, waterEffect);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        waterWidth = w;
        waterHeight = h;
      }
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, waterTarget);
      const pass=waterPass;
      const {waterOrigin,waterSpan,waterTime,waterDetail,worldToSource,waterTilt}=pass.uniforms;
      gl.useProgram(pass.program);
      gl.disable(gl.DEPTH_TEST);
      gl.viewport(0, 0, w, h);
      gl.uniform2f(waterOrigin, (left-tx) / (zoom*chartSize.width), (top-ty) / (zoom*chartSize.height));
      gl.uniform2f(waterSpan, width / (zoom*chartSize.width), height / (zoom*chartSize.height));
      gl.uniform2f(worldToSource, zoom / width, zoom / height);
      gl.uniform1f(waterTime, phase);
      gl.uniform1f(waterDetail, fade(zoom - 1.25, 3.25));
      gl.uniform1f(waterTilt, tilt);
      gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, quadOffset);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, waterEffect);
      waterRevision = revision;
      waterPassPhase = phase;
      waterPassTilt = tilt;
      waterDraws++;
      waterPixels += w*h;
    }

    let uploadedRevision = -1;
    let textureUploads = 0;
    let hasWater = false;
    return {
      get hasWater() { return hasWater; },
      setWater(shore, flow, cross) {
        gl.activeTexture(gl.TEXTURE3);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, atlasSize, atlasSize, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, shore);
        gl.activeTexture(gl.TEXTURE5);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, waveFlowSize, waveFlowSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, flow);
        gl.activeTexture(gl.TEXTURE6);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, waveFlowSize, waveFlowSize, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, cross);
        gl.activeTexture(gl.TEXTURE0);
        waterRevision = -1;
        hasWater = true;
      },
      get textureUploads() { return textureUploads; },
      get waterDraws() { return waterDraws; },
      get waterPixels() { return waterPixels; },
      get waterPixelBudget() { return waterPixelBudget; },
      maxTextureSize,
      draw(source, view, rect, ratio, revision, waterPhase = 0) {
        if (gl.isContextLost()) return false;
        const {projection: {cx, cy, cos, sin, focal, reliefScale, edgeDrop}, tx, ty, zoom, w, h} = view;
        const width = Math.round(w * ratio), height = Math.round(h * ratio);
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        if (canvas.style.width !== w + 'px') canvas.style.width = w + 'px';
        if (canvas.style.height !== h + 'px') canvas.style.height = h + 'px';
        if (uploadedRevision !== revision) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, rawColor);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
          uploadedRevision = revision;
          textureUploads++;
        }
        if (hasWater) renderWater(view, rect, revision, waterPhase);
        gl.useProgram(program);
        if (reliefScale) gl.enable(gl.DEPTH_TEST);
        else gl.disable(gl.DEPTH_TEST);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | (reliefScale ? gl.DEPTH_BUFFER_BIT : 0));
        gl.uniform2f(sourceSize, rect.width, rect.height);
        gl.uniform2f(offset, rect.left, rect.top);
        gl.uniform2f(center, cx, cy);
        gl.uniform2f(translation, tx, ty);
        gl.uniform3f(camera, cos, sin, focal);
        gl.uniform1f(scale, zoom);
        gl.uniform1f(heightScale, reliefScale);
        gl.uniform1f(edgeDropUniform, edgeDrop / cy);
        gl.uniform1i(waterReadyUniform, hasWater);
        if (reliefScale) gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        else gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, quadOffset);
        return true;
      }
    };
  }

  window.ROTTA_EUROPE_PITCH = {project, sourceRect, maxAngle, loadHeights, loadWater, sampleHeight, renderer};
})();

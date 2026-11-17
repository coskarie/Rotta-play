(() => {
  const path = 'assets/europe/terrain/';
  const version = '?v=3';
  const maxDownloads = 4;
  const maxDecodedBytes = 48 * 1024 * 1024;
  const retryDelay = 15000;
  const waterInterval = 1000 / 12;
  let assets;

  async function fetchAsset(file, signal) {
    const response = await fetch(path + file + version, {cache: 'force-cache', signal});
    if (!response.ok) throw new Error('Europe terrain ' + file + ': ' + response.status);
    return response;
  }

  async function loadImage(file, signal) {
    return createImageBitmap(await (await fetchAsset(file, signal)).blob());
  }

  function preload() {
    return assets ??= Promise.all([
      fetchAsset('manifest.json').then(response => response.json()),
      loadImage('overview.webp')
    ]).then(([manifest, overview]) => ({
      ...manifest, overview,
      levels: manifest.levels.map(level => ({...level, tiles: level.tiles && new Set(level.tiles)}))
    })).catch(error => {
      assets = null;
      throw error;
    });
  }

  function mount(viewport, world, terrain, onReliefChange) {
    const {width, height, gutter, levels, overview} = terrain;
    const canvas = document.createElement('canvas');
    canvas.className = 'europe-terrain';
    canvas.setAttribute('aria-hidden', 'true');
    viewport.insertBefore(canvas, world);
    const context = canvas.getContext('2d', {alpha: false});
    const pitch = window.ROTTA_EUROPE_PITCH;
    let pitchCanvas, relief, elevationLoad, elevations, view;
    let nextElevationRetry = 0;
    let reliefVisible = false;
    let flatRevision = -1;
    let flatWaterFrame = 0;
    let presentedWaterFrame = 0;
    let waterLoad, waterAssets, waterTimer;
    let nextWaterRetry = 0;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const cache = new Map();
    const loading = new Map();
    const failures = new Map();
    let active = false;
    let camera;
    let wanted = new Map();
    let loadOrder = [];
    let visibleCoarseCount = 0;
    let decodedBytes = 0;
    let frame = 0;
    let peakDownloads = 0;
    let paintCount = 0;

    function visibleTiles({tx, ty, zoom, w, h, ratio}) {
      const left = Math.max(0, -tx / zoom);
      const top = Math.max(0, -ty / zoom);
      const right = Math.min(width, (w - tx) / zoom);
      const bottom = Math.min(height, (h - ty) / zoom);
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      const tiers = [];
      for (const [index, level] of levels.entries()) {
        if (zoom < (level.minZoom ?? 0)) break;
        const {worldSize: span, pixels, tiles} = level;
        const tileBytes = (pixels + gutter * 2) ** 2 * 4;
        const levelTiles = [];
        for (let row = Math.floor(top / span); row < Math.ceil(bottom / span); row++) {
          for (let col = Math.floor(left / span); col < Math.ceil(right / span); col++) {
            const id = col + '-' + row;
            if (tiles && !tiles.has(id)) continue;
            const x = col * span;
            const y = row * span;
            levelTiles.push({key: span + '/' + id, level, x, y,
              priority: Math.hypot(x + span / 2 - centerX, y + span / 2 - centerY)});
          }
        }
        if (level === levels[0]) visibleCoarseCount = levelTiles.length;
        levelTiles.sort((a, b) => a.priority - b.priority);
        tiers.push({tileBytes, tiles: levelTiles});
        if (!levels[index + 1]?.minZoom && zoom * ratio <= pixels / span * 1.6) break;
      }

      const priorities = zoom >= (levels.find(level => level.minZoom)?.minZoom ?? Infinity)
        ? [...tiers.slice(0, 2), ...tiers.slice(2).reverse()]
        : tiers;
      let availableBytes = maxDecodedBytes;
      loadOrder = [];
      for (const tier of priorities) {
        tier.tiles.length = Math.min(tier.tiles.length, Math.floor(availableBytes / tier.tileBytes));
        availableBytes -= tier.tiles.length * tier.tileBytes;
        loadOrder.push(...tier.tiles);
      }
      return new Map(tiers.flatMap(tier => tier.tiles.map(tile => [tile.key, tile])));
    }

    function paint() {
      frame = 0;
      if (!active || !camera) return;
      const {tx, ty, zoom, w, h, ratio} = camera;
      const deviceWidth = Math.round(w * ratio);
      const deviceHeight = Math.round(h * ratio);
      if (canvas.width !== deviceWidth) canvas.width = deviceWidth;
      if (canvas.height !== deviceHeight) canvas.height = deviceHeight;
      const xAt = x => Math.round((tx + x * zoom) * ratio);
      const yAt = y => Math.round((ty + y * zoom) * ratio);
      context.fillStyle = '#2d5557';
      context.fillRect(0, 0, deviceWidth, deviceHeight);
      paintCount++;
      const originX = xAt(0), originY = yAt(0);
      const endX = xAt(width), endY = yAt(height);
      const leftEdge = Math.max(0, originX), topEdge = Math.max(0, originY);
      const viewWidth = Math.min(deviceWidth, endX) - leftEdge;
      const viewHeight = Math.min(deviceHeight, endY) - topEdge;
      if (viewWidth <= 0 || viewHeight <= 0) {
        present();
        return;
      }
      context.save();
      context.beginPath();
      context.rect(leftEdge, topEdge, viewWidth, viewHeight);
      context.clip();
      const coarseSize = levels[0].worldSize;
      let cachedCoarseCount = 0;
      for (const tile of wanted.values()) {
        if (tile.level.worldSize !== coarseSize) break;
        if (cache.has(tile.key)) cachedCoarseCount++;
      }
      if (cachedCoarseCount < visibleCoarseCount) {
        const scaleX = overview.width / (endX - originX);
        const scaleY = overview.height / (endY - originY);
        context.drawImage(overview, (leftEdge - originX) * scaleX, (topEdge - originY) * scaleY,
          viewWidth * scaleX, viewHeight * scaleY, leftEdge, topEdge, viewWidth, viewHeight);
      }
      for (const tile of wanted.values()) {
        const entry = cache.get(tile.key);
        if (!entry) continue;
        const {x, y, level: {worldSize, pixels}} = tile;
        const left = xAt(x), top = yAt(y);
        context.drawImage(entry.image, gutter, gutter, pixels, pixels,
          left, top, xAt(x + worldSize) - left, yAt(y + worldSize) - top);
      }
      context.restore();
      present();
    }

    function prepareElevation() {
      if (elevationLoad || performance.now() < nextElevationRetry) return;
      elevationLoad = pitch.loadHeights().then(heights => {
        elevations = heights;
        pitchCanvas = document.createElement('canvas');
        pitchCanvas.className = 'europe-terrain';
        pitchCanvas.hidden = true;
        pitchCanvas.setAttribute('aria-hidden', 'true');
        relief = pitch.renderer(pitchCanvas, heights);
        if (!relief) return;
        pitchCanvas.addEventListener('webglcontextlost', event => {
          event.preventDefault();
          relief = null;
          flatRevision = -1;
          if (active && camera) present();
        });
        pitchCanvas.addEventListener('webglcontextrestored', () => {
          relief = pitch.renderer(pitchCanvas, heights);
          if (waterAssets) relief?.setWater(...waterAssets);
          refreshView();
        });
        viewport.insertBefore(pitchCanvas, world);
        refreshView();
      }).catch(error => {
        console.warn(error);
        nextElevationRetry = performance.now() + retryDelay;
        elevationLoad = null;
      });
    }

    function prepareWater() {
      if (!relief || waterLoad || performance.now() < nextWaterRetry) return;
      waterLoad = pitch.loadWater().then(assets => {
        waterAssets = assets;
        relief?.setWater(...assets);
        flatRevision = -1;
        if (active && camera) present();
      }).catch(error => {
        console.warn(error);
        nextWaterRetry = performance.now() + retryDelay;
        waterLoad = null;
      });
    }

    function waterAnimating() {
      return Boolean(active && relief?.hasWater && view.showColors && !document.hidden && !reducedMotion?.matches);
    }

    function waterFrameInterval() {
      return view?.zoom<=1.1?125:waterInterval;
    }

    function waterFrameNow() {
      const interval=waterFrameInterval();
      return Math.floor(performance.now()/interval)*interval;
    }

    function stopWater() {
      clearTimeout(waterTimer);
      waterTimer = undefined;
    }

    function scheduleWater() {
      if (!waterAnimating()) {
        stopWater();
      } else if (waterTimer === undefined) {
        waterTimer = setTimeout(() => {
          waterTimer = undefined;
          if (!waterAnimating() || !camera) return;
          // A camera update may have drawn this phase already.
          if (presentedWaterFrame !== waterFrameNow()) present();
          else scheduleWater();
        }, waterFrameInterval());
      }
    }

    function updateWaterMotion() {
      if (active && camera && relief?.hasWater) present();
    }

    document.addEventListener('visibilitychange', updateWaterMotion);
    reducedMotion?.addEventListener?.('change', updateWaterMotion);

    function present() {
      prepareWater();
      const waterFrame = waterAnimating() ? waterFrameNow() : 0;
      const waterPhase = (waterFrame / 8000) % (2 * Math.PI);
      const left = view.tx - camera.tx;
      const top = view.ty - camera.ty;
      const rect = {left, top, width: camera.w, height: camera.h};
      let rendered = false;
      if (view.projection) {
        flatRevision = -1;
        rendered = Boolean(relief?.draw(canvas, view, rect, camera.displayRatio, paintCount, waterPhase));
      } else if (relief && view.showColors) {
        // The padded map is reused between water frames, with no tile uploads when only the water moves.
        if (flatRevision !== paintCount || flatWaterFrame !== waterFrame) {
          const projection = pitch.project(camera.w, camera.h, 0);
          const flat = {...camera, projection,waterFocus:view.waterFocus};
          const source = {left: 0, top: 0, width: camera.w, height: camera.h};
          if (relief.draw(canvas, flat, source, camera.ratio, paintCount, waterPhase)) {
            flatRevision = paintCount;
            flatWaterFrame = waterFrame;
          }
        }
        rendered = flatRevision === paintCount;
      }
      if (pitchCanvas && pitchCanvas.hidden === rendered) pitchCanvas.hidden = !rendered;
      const visibility = rendered ? 'hidden' : '';
      if (canvas.style.visibility !== visibility) canvas.style.visibility = visibility;
      const transform = 'translate3d(' + left + 'px, ' + top + 'px, 0px)';
      const display = rendered ? pitchCanvas : canvas;
      const nextTransform = view.projection
        ? (rendered ? '' : view.projection.transform(left, top))
        : transform;
      if (display.style.transform !== nextTransform) display.style.transform = nextTransform;
      const pitchedRelief = rendered && Boolean(view.projection);
      const mode = pitchedRelief ? 'relief' : view.projection ? 'flat' : '';
      if (viewport.dataset.terrainPitch !== mode) viewport.dataset.terrainPitch = mode;
      if (reliefVisible !== pitchedRelief) {
        reliefVisible = pitchedRelief;
        onReliefChange?.();
      }
      presentedWaterFrame = waterFrame;
      scheduleWater();
    }

    function evict() {
      for (const [key, entry] of cache) {
        if (decodedBytes <= maxDecodedBytes) return;
        if (wanted.has(key)) continue;
        cache.delete(key);
        decodedBytes -= entry.bytes;
        entry.image.close();
      }
    }

    function pump() {
      if (!active || loading.size >= maxDownloads) return;
      const now = performance.now();
      const queue = loadOrder.filter(({key}) =>
        !cache.has(key) && !loading.has(key) && (failures.get(key) ?? 0) <= now);
      for (const {key} of queue.slice(0, maxDownloads - loading.size)) {
        const controller = new AbortController();
        loading.set(key, controller);
        peakDownloads = Math.max(peakDownloads, loading.size);
        loadImage(key + '.webp', controller.signal).then(image => {
          if (!active || !wanted.has(key) || controller.signal.aborted) {
            image.close();
            return;
          }
          const bytes = image.width * image.height * 4;
          decodedBytes += bytes;
          failures.delete(key);
          cache.set(key, {image, bytes});
          evict();
          if (!frame) frame = requestAnimationFrame(paint);
        }).catch(error => {
          if (!controller.signal.aborted) failures.set(key, performance.now() + retryDelay);
        }).finally(() => {
          loading.delete(key);
          pump();
        });
      }
    }

    function refreshView() {
      if (!active || !view) return;
      const {tx, ty, zoom, w, h, projection, showColors,waterFocus} = view;
      update(tx, ty, zoom, w, h, projection, showColors,waterFocus);
    }

    function update(tx, ty, zoom, w, h, projection = null, showColors = true,waterFocus=null) {
      if (w < 1 || h < 1) return;
      view = {tx, ty, zoom, w, h, projection, showColors,waterFocus};
      if (!active) return;
      const displayRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const required = projection
        ? pitch.sourceRect(projection, zoom)
        : {left: 0, top: 0, width: w, height: h};
      prepareElevation();
      const textureLimit = relief?.maxTextureSize ?? (projection ? 4096 : Infinity);
      const sourceRatio = (width, height) => Math.min(displayRatio, textureLimit / Math.max(width, height));
      if (camera && camera.zoom === zoom && camera.viewWidth === w && camera.viewHeight === h &&
          camera.displayRatio === displayRatio &&
          Math.max(canvas.width, canvas.height) <= textureLimit &&
          (projection || camera.ratio === sourceRatio(camera.w, camera.h))) {
        const left = tx - camera.tx, top = ty - camera.ty;
        if (left <= required.left && top <= required.top &&
            left + camera.w >= required.left + required.width &&
            top + camera.h >= required.top + required.height) {
          present();
          return;
        }
      }
      const pad = Math.min(128, Math.ceil(Math.min(w, h) * .12));
      const left = required.left - pad, top = required.top - pad;
      const width = required.width + 2 * pad, height = required.height + 2 * pad;
      const ratio = sourceRatio(width, height);
      camera = {tx: tx - left, ty: ty - top, zoom, w: width, h: height, ratio, displayRatio, viewWidth: w, viewHeight: h};
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.style.transformOrigin = '0 0';
      wanted = visibleTiles(camera);
      for (const [key, controller] of loading) {
        if (!wanted.has(key)) controller.abort();
      }
      for (const key of wanted.keys()) {
        const entry = cache.get(key);
        if (!entry) continue;
        cache.delete(key);
        cache.set(key, entry);
      }
      if (frame) cancelAnimationFrame(frame);
      paint();
      pump();
    }

    function setActive(value) {
      if (active === value) return;
      active = value;
      if (active) {
        refreshView();
        return;
      }
      stopWater();
      camera = null;
      reliefVisible = false;
      flatRevision = -1;
      wanted.clear();
      loadOrder = [];
      for (const controller of loading.values()) controller.abort();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      canvas.width = canvas.height = 1;
      if (pitchCanvas) {
        pitchCanvas.hidden = true;
        pitchCanvas.width = pitchCanvas.height = 1;
      }
    }

    return {update, setActive,
      setWaterFocus(x,y){if(view)view.waterFocus={x,y};},
      get reliefVisible() { return reliefVisible; },
      heightAt: (x, y) => reliefVisible && view.projection ? view.projection.reliefScale * pitch.sampleHeight(elevations, x, y) : 0,
      stats: () => ({
        cachedTiles: cache.size, decodedBytes, downloads: loading.size,
        peakDownloads, paintCount, textureUploads: relief?.textureUploads ?? 0, visibleTiles: wanted.size,
        waterDraws: relief?.waterDraws ?? 0, waterPixels: relief?.waterPixels ?? 0,
        waterPixelBudget:relief?.waterPixelBudget??0,waterFramesPerSecond:1000/waterFrameInterval()
      })};
  }

  window.ROTTA_EUROPE_TERRAIN = {preload, mount};
})();

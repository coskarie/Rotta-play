(() => {
  const path = 'assets/europe/terrain/';
  const version = '?v=3';
  const maxDownloads = 4;
  const maxDecodedBytes = 48 * 1024 * 1024;
  const retryDelay = 15000;
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

  function mount(viewport, world, terrain) {
    const {width, height, gutter, levels, overview} = terrain;
    const canvas = document.createElement('canvas');
    canvas.className = 'europe-terrain';
    canvas.setAttribute('aria-hidden', 'true');
    viewport.insertBefore(canvas, world);
    const context = canvas.getContext('2d', {alpha: false});
    const pitch = window.ROTTA_EUROPE_PITCH;
    let pitchCanvas, relief, elevationLoad, view, sourceRect;
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
      paintCount++;
      present();
    }

    function prepareRelief() {
      if (elevationLoad) return;
      elevationLoad = pitch.loadHeights().then(heights => {
        pitchCanvas = document.createElement('canvas');
        pitchCanvas.className = 'europe-terrain';
        pitchCanvas.hidden = true;
        pitchCanvas.setAttribute('aria-hidden', 'true');
        relief = pitch.renderer(pitchCanvas, heights);
        if (!relief) return;
        pitchCanvas.addEventListener('webglcontextlost', event => {
          event.preventDefault();
          relief = null;
          if (active) present();
        });
        pitchCanvas.addEventListener('webglcontextrestored', () => {
          relief = pitch.renderer(pitchCanvas, heights);
          if (active && view.projection) update(view.tx, view.ty, view.zoom, view.w, view.h, view.projection);
        });
        viewport.insertBefore(pitchCanvas, world);
        if (active && view.projection) update(view.tx, view.ty, view.zoom, view.w, view.h, view.projection);
      }).catch(error => console.warn(error));
    }

    function present() {
      const rendered = Boolean(sourceRect && relief?.draw(canvas, view, sourceRect, camera.displayRatio));
      if (pitchCanvas) pitchCanvas.hidden = !rendered;
      canvas.style.visibility = rendered ? 'hidden' : '';
      if (sourceRect && !rendered) {
        canvas.style.width = sourceRect.width + 'px';
        canvas.style.height = sourceRect.height + 'px';
        canvas.style.transformOrigin = '0 0';
        canvas.style.transform = view.projection.transform(sourceRect.left, sourceRect.top);
      } else {
        canvas.style.width = canvas.style.height = canvas.style.transform = '';
      }
      viewport.dataset.terrainPitch = rendered ? 'relief' : sourceRect ? 'flat' : '';
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

    function update(tx, ty, zoom, w, h, projection = null) {
      if (w < 1 || h < 1) return;
      view = {tx, ty, zoom, w, h, projection};
      if (!active) return;
      const displayRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      sourceRect = projection ? pitch.sourceRect(projection, zoom) : null;
      if (sourceRect) {
        prepareRelief();
        const {left, top, width, height} = sourceRect;
        const ratio = Math.min(displayRatio, (relief?.maxTextureSize ?? 4096) / Math.max(width, height));
        camera = {tx: tx - left, ty: ty - top, zoom, w: width, h: height, ratio, displayRatio};
      } else {
        camera = {tx, ty, zoom, w, h, ratio: displayRatio, displayRatio};
      }
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
        if (view) update(view.tx, view.ty, view.zoom, view.w, view.h, view.projection);
        return;
      }
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

    return {update, setActive, stats: () => ({
      cachedTiles: cache.size, decodedBytes, downloads: loading.size,
      peakDownloads, paintCount, visibleTiles: wanted.size
    })};
  }

  window.ROTTA_EUROPE_TERRAIN = {preload, mount};
})();

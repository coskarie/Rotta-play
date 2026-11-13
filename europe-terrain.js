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
      if (viewWidth <= 0 || viewHeight <= 0) return;
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

    function update(tx, ty, zoom, w, h) {
      if (w < 1 || h < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      camera = {tx, ty, zoom, w, h, ratio};
      if (!active) return;
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
        if (camera) update(camera.tx, camera.ty, camera.zoom, camera.w, camera.h);
        return;
      }
      wanted.clear();
      loadOrder = [];
      for (const controller of loading.values()) controller.abort();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      canvas.width = canvas.height = 1;
    }

    return {update, setActive, stats: () => ({
      cachedTiles: cache.size, decodedBytes, downloads: loading.size,
      peakDownloads, paintCount, visibleTiles: wanted.size
    })};
  }

  window.ROTTA_EUROPE_TERRAIN = {preload, mount};
})();

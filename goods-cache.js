(function () {
  'use strict';
  const VERSION = '29';
  const urls = [...new Set(Object.values(window.ROTTA_GOODS_ATLAS).map(art => `${art.path}?v=${VERSION}`))];
  const decoded = new Map();
  const stats = {total: urls.length, loaded: 0, cached: 0, downloaded: 0, ready: false};
  let pending = null;

  async function decode(response) {
    if (!response?.ok) throw new Error('Invalid goods image response');
    const url = URL.createObjectURL(await response.blob());
    const image = new Image();
    image.decoding = 'async';
    try {
      if (image.decode) { image.src = url; await image.decode(); }
      else await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('Invalid goods image');
      return {url, image}; // Retain decoded pixels and the object URL for the full game session.
    } catch (error) { URL.revokeObjectURL(url); throw error; }
  }

  async function load(url, cache) {
    if (decoded.has(url)) return;
    let cached;
    try { cached = await cache?.match(url); } catch (_) { /* Storage may be unavailable. */ }
    if (cached) {
      try { decoded.set(url, await decode(cached)); stats.cached++; return; }
      catch (_) { try { await cache.delete(url); } catch (_) {} }
    }
    let error;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, {cache: attempt ? 'reload' : 'force-cache', signal: window.AbortSignal?.timeout?.(30000)});
        const retained = response.clone();
        decoded.set(url, await decode(response));
        stats.downloaded++;
        try { await cache?.put(url, retained); } catch (_) { /* Memory cache still works if storage is full. */ }
        return;
      } catch (failure) { error = failure; }
    }
    throw error;
  }

  function preload(onProgress = () => {}) {
    if (pending) return pending;
    pending = (async () => {
      let cache = null;
      try { cache = await window.caches?.open(`rotta-goods-${VERSION}`); } catch (_) {}
      let next = 0;
      const errors = [];
      const report = () => { stats.loaded = decoded.size; onProgress(stats.loaded, stats.total); };
      report();
      await Promise.all(Array.from({length: Math.min(6, urls.length)}, async () => {
        while (next < urls.length) {
          const url = urls[next++];
          try { await load(url, cache); } catch (error) { errors.push(error); }
          report();
        }
      }));
      stats.ready = decoded.size === urls.length;
      if (!stats.ready) throw errors[0] || new Error('Goods images incomplete');
      return stats;
    })().finally(() => { pending = null; });
    return pending;
  }

  window.ROTTA_GOODS_CACHE = {
    stats, preload,
    source(path) { const url = `${path}?v=${VERSION}`; return decoded.get(url)?.url || url; }
  };
})();

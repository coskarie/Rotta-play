/* Lisbon surface materials share the Europe chart's coordinates and land geometry. */
(function (root) {
  'use strict';

  const BASE = 'assets/europe/lisbon/';
  const VERSION = '?v=2';
  const LAYERS = ['sea', 'land'];
  const overviewFile = layer => layer + '-overview.webp';
  const tileFile = (layer, tile, level) => layer + '-' + tile.id + '-' + level + '.webp';
  const urlFor = file => BASE + file + VERSION;
  const overviewFiles = ['fade.png', ...LAYERS.map(overviewFile)];
  const cache = new Map();
  let manifest, loading;

  function warm(file) {
    if (cache.has(file)) {
      const record = cache.get(file);
      cache.delete(file);
      cache.set(file, record);
      return record.promise;
    }
    const image = new Image();
    image.src = urlFor(file);
    const promise = image.decode().catch(error => {
      if (cache.get(file)?.image === image) cache.delete(file);
      throw error;
    });
    cache.set(file, {image, promise});
    return promise;
  }

  function preload() {
    if (!loading) loading = (async () => {
      const response = await fetch(urlFor('manifest.json'), {cache: 'force-cache'});
      if (!response.ok) throw Error('Lisbon materials: ' + response.status);
      const data = await response.json();
      if (data.version !== 2) throw Error('Lisbon materials: unexpected manifest version');
      await Promise.all(overviewFiles.map(warm));
      manifest = data;
      return data;
    })().catch(error => {
      loading = null;
      console.warn('[Rotta Lisbon materials]', error);
      return null;
    });
    return loading;
  }

  function el(tag, attrs = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }

  function mapImage(file, x, y, width, height) {
    return el('image', {href: urlFor(file), x, y, width, height, preserveAspectRatio: 'none'});
  }

  function mount(svg, defs, landLayer, chart) {
    if (!manifest) return {update() {}};
    const {bounds: [west, north, east, south], tiles, tileWorldSize, gutter} = manifest;
    const width = east - west, height = south - north;
    const clip = el('clipPath', {id: 'lisbon-land-clip', clipPathUnits: 'userSpaceOnUse'});
    for (const chunk of chart.chunks) {
      const [x0, y0, x1, y1] = chunk.bbox;
      if (x0 < east && x1 > west && y0 < south && y1 > north) {
        clip.append(el('path', {d: chunk.land, 'clip-rule': 'evenodd'}));
      }
    }
    const mask = el('mask', {
      id: 'lisbon-fade', maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse',
      x: west, y: north, width, height, style: 'mask-type:alpha'
    });
    mask.append(mapImage('fade.png', west, north, width, height));
    defs.append(clip, mask);

    const details = {};
    for (const layer of LAYERS) {
      const group = el('g', {class: 'lisbon-' + layer + '-material', 'pointer-events': 'none'});
      const surface = el('g', {mask: 'url(#lisbon-fade)'});
      details[layer] = el('g', {class: 'lisbon-detail'});
      surface.append(mapImage(overviewFile(layer), west, north, width, height), details[layer]);
      group.append(surface);
      if (layer === 'land') {
        group.setAttribute('clip-path', 'url(#lisbon-land-clip)');
        svg.append(group);
      } else {
        svg.insertBefore(group, landLayer);
      }
    }

    const size = tileWorldSize + gutter * 2;
    let signature = '', revision = 0;

    function update(x0, y0, x1, y1) {
      const ppu = (svg.parentElement?.parentElement?.clientWidth || 1280)
        / Math.max(1, x1 - x0) * (root.devicePixelRatio || 1);
      const level = ppu > 9 ? 'detail' : ppu > 4 ? 'medium' : '';
      const visible = level ? tiles.filter(({x, y}) =>
        x - gutter < x1 && x + tileWorldSize + gutter > x0 &&
        y - gutter < y1 && y + tileWorldSize + gutter > y0
      ) : [];
      const key = visible.length ? level + ':' + visible.map(tile => tile.id).join(',') : 'overview';
      if (key === signature) return;
      signature = key;
      const request = ++revision;

      if (!visible.length) {
        for (const layer of LAYERS) details[layer].replaceChildren();
        return;
      }

      const files = LAYERS.flatMap(layer => visible.map(tile => tileFile(layer, tile, level)));
      Promise.all(files.map(warm)).then(() => {
        if (request !== revision) return;
        for (const layer of LAYERS) {
          details[layer].replaceChildren(...visible.map(tile =>
            mapImage(tileFile(layer, tile, level), tile.x - gutter, tile.y - gutter, size, size)
          ));
        }
      }).catch(() => {
        if (request === revision) signature = '';
      });

      const active = new Set([...overviewFiles, ...files]);
      const optional = [...cache.keys()].filter(file => !active.has(file));
      for (const file of optional.slice(0, Math.max(0, optional.length - 12))) cache.delete(file);
    }

    return {update};
  }

  root.ROTTA_LISBON_COAST = {preload, mount};
})(window);

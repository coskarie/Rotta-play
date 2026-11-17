(() => {
  const root = 'assets/europe/scenery/';
  const types = {
    W: ['stone-warehouse', 5.5],
    H: ['white-townhouse', 4.1],
    C: ['fishing-cottage', 3.6],
    G: ['grey-gabled-house', 4.2],
    B: ['timber-boathouse', 5.7],
    O: ['ochre-townhouse', 4],
    F: ['fishing-workhouse', 5],
    T: ['stone-lookout', 3.2]
  };

  // Three staggered rows for each site. Row entries specify the north/south
  // offset, east/west offset, spacing, and the buildings from west to east.
  const layout = [
    {id: 'western-headland', x: 4859.6, y: 13690.8, slope: .16, near: 34, far: 73,
      rows: [[-1.9, .35, 1.55, 'TGOC'], [-.2, -.35, 1.47, 'CGHOC'], [1.5, .2, 1.75, 'BFCW']]},
    {id: 'west-fishing-landing', x: 4881.5, y: 13699.5, slope: .22, near: 26, far: 61,
      rows: [[-2.0, -.2, 1.42, 'HGOH'], [-.45, .45, 1.44, 'OCGHF'], [1.35, -.45, 1.56, 'CFBWC']]},
    {id: 'north-quay', x: 4895.5, y: 13698.7, slope: -.10, near: 37, far: 70,
      rows: [[-2.2, .4, 1.38, 'GHOHG'], [-.5, -.45, 1.43, 'OCHGO'], [1.25, .15, 1.65, 'BWFCW']]},
    {id: 'lisbon-waterfront', x: 4909.8, y: 13698.0, slope: .08, near: 45, far: 80,
      rows: [[-2.45, .45, 1.38, 'HOHGOH'], [-.65, -.25, 1.40, 'GHOHGCO'], [1.20, .35, 1.61, 'WBHFWO']]},
    {id: 'north-east-cove', x: 4927.0, y: 13692.4, slope: -.24, near: 40, far: 78,
      rows: [[-1.95, -.5, 1.43, 'GHOG'], [-.3, .3, 1.40, 'HCGOH'], [1.35, -.3, 1.73, 'WBOF']]},
    {id: 'south-mouth', x: 4919.0, y: 13727.3, slope: -.26, near: 32, far: 71,
      rows: [[-1.8, .25, 1.45, 'GOH'], [-.2, -.4, 1.43, 'CHFC'], [1.45, .25, 1.63, 'FBCF']]},
    {id: 'south-landing', x: 4933.4, y: 13720.4, slope: .06, near: 40, far: 77,
      rows: [[-2.1, .35, 1.49, 'HGOH'], [-.35, -.4, 1.41, 'GCHOGC'], [1.52, .1, 1.58, 'WBFCWO']]},
    {id: 'east-south-bank', x: 4950.4, y: 13712.1, slope: .10, near: 39, far: 77,
      rows: [[-1.95, .4, 1.45, 'OHC'], [-.35, -.35, 1.46, 'HGCFO'], [1.45, .45, 1.70, 'CFBC']]}
  ].map(({rows, slope, ...site}) => ({
    ...site,
    buildings: rows.flatMap(([dy, shift, spacing, kinds], row) =>
      [...kinds].map((kind, index) => {
        const [asset, width] = types[kind];
        const dx = (index - (kinds.length - 1) / 2) * spacing + shift;
        const irregularity = ((index + row * 2) % 4 - 1.5) * .12;
        return {asset, width, x: site.x + dx, y: site.y + dy + slope * dx + irregularity};
      }))
  }));

  function smooth(start, end, value) {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  }

  function createGroup(layer, site) {
    const group = document.createElement('div');
    group.dataset.settlement = site.id;
    const sprites = site.buildings.map(site => {
      const image = document.createElement('img');
      image.dataset.scene = site.asset;
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      image.src = root + site.asset + '-v3.webp?v=settlements';
      group.append(image);
      return {site, image, opacity: -1, width: -1, depth: -1, transform: ''};
    });
    layer.append(group);
    return {group, sprites};
  }

  function mount(overlay, project) {
    const layer = document.createElement('div');
    layer.className = 'coastal-scenery';
    layer.setAttribute('aria-hidden', 'true');
    overlay.prepend(layer);
    const views = layout.map(site => ({site, view: null}));

    return {
      update(shipX, shipY, zoom, width, height) {
        const detail = smooth(2.4, 4.1, zoom);
        const scale = Math.min(zoom, 8);
        const margin = 92;
        for (const entry of views) {
          const {site} = entry;
          const distance = Math.hypot(shipX - site.x, shipY - site.y);
          const opacity = Math.round(100 * detail * (1 - smooth(site.near, site.far, distance))) / 100;
          const center = opacity ? project(site.x, site.y) : null;
          const inView = center && center.x > -margin && center.x < width + margin &&
            center.y > -margin && center.y < height + margin;
          if (!inView) {
            if (entry.view && !entry.view.group.hidden) entry.view.group.hidden = true;
            continue;
          }

          const {group, sprites} = entry.view ??= createGroup(layer, site);
          if (group.hidden) group.hidden = false;
          for (const sprite of sprites) {
            const {site: building, image} = sprite;
            const {x, y, depth} = project(building.x, building.y);
            const visible = Number.isFinite(x) && Number.isFinite(y);
            if (image.hidden === visible) image.hidden = !visible;
            if (!visible) continue;

            const displayWidth = Math.round(building.width * scale) / 2;
            const order = Math.round(depth * 200);
            const transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-97%)`;
            if (sprite.width !== displayWidth) {
              image.style.width = displayWidth + 'px';
              sprite.width = displayWidth;
            }
            if (sprite.opacity !== opacity) {
              image.style.opacity = opacity;
              sprite.opacity = opacity;
            }
            if (sprite.depth !== order) {
              image.style.zIndex = order;
              sprite.depth = order;
            }
            if (sprite.transform !== transform) {
              image.style.transform = transform;
              sprite.transform = transform;
            }
          }
        }
      }
    };
  }

  window.ROTTA_LISBON_SCENERY = {mount};
})();

(() => {
  const root = 'assets/europe/scenery/';
  // x increases east along the waterfront. The few houses behind the quay are
  // staggered between the front buildings so that roofs and lanes stay visible.
  const waterfront = [
    {kind: 'stone-warehouse', x: 4895.2, y: 13699.5, width: 5.5},
    {kind: 'white-townhouse', x: 4900.1, y: 13700.3, width: 4.1},
    {kind: 'grey-gabled-house', x: 4903.2, y: 13696.1, width: 4.2},
    {kind: 'timber-boathouse', x: 4906.1, y: 13700.1, width: 5.7},
    {kind: 'ochre-townhouse', x: 4910.0, y: 13698.3, width: 4.0},
    {kind: 'fishing-workhouse', x: 4914.5, y: 13700.2, width: 5.0},
    {kind: 'stone-warehouse', x: 4920.1, y: 13697.9, width: 5.8},
    {kind: 'white-townhouse', x: 4923.6, y: 13694.0, width: 4.3},
    {kind: 'grey-gabled-house', x: 4928.7, y: 13694.7, width: 4.3}
  ];
  const fishingLanding = [
    {kind: 'fishing-cottage', x: 4877.2, y: 13700.8, width: 3.6},
    {kind: 'fishing-workhouse', x: 4881.5, y: 13702.2, width: 4.0},
    {kind: 'ochre-townhouse', x: 4884.0, y: 13699.6, width: 3.4},
    {kind: 'timber-boathouse', x: 4888.0, y: 13703.7, width: 4.5}
  ];
  const headland = [
    {kind: 'stone-lookout', x: 4857.0, y: 13690.6, width: 3.2},
    {kind: 'fishing-cottage', x: 4860.4, y: 13695.2, width: 3.4}
  ];
  const sites = [
    ...waterfront.map(site => ({...site, near: 43, far: 80})),
    ...fishingLanding.map(site => ({...site, near: 18, far: 48})),
    ...headland.map(site => ({...site, near: 35, far: 66}))
  ].sort((a, b) => a.y - b.y);
  const reach = {
    west: Math.min(...sites.map(site => site.x - site.far)),
    east: Math.max(...sites.map(site => site.x + site.far)),
    north: Math.min(...sites.map(site => site.y - site.far)),
    south: Math.max(...sites.map(site => site.y + site.far))
  };

  function smooth(start, end, value) {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  }

  function mount(overlay, project) {
    const layer = document.createElement('div');
    layer.className = 'coastal-scenery';
    layer.setAttribute('aria-hidden', 'true');
    overlay.prepend(layer);

    const sprites = sites.map(site => {
      const image = document.createElement('img');
      image.dataset.scene = site.kind;
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      image.hidden = true;
      // DOM order puts south-facing foreground buildings in front of those upshore.
      layer.append(image);
      return {site, image, opacity: -1, width: -1, transform: '', requested: false};
    });

    let anyVisible = false;
    return {
      update(shipX, shipY, zoom, width, height) {
        const detail = smooth(2.4, 4.1, zoom);
        if (!detail || shipX < reach.west || shipX > reach.east || shipY < reach.north || shipY > reach.south) {
          if (anyVisible) {
            for (const {image} of sprites) image.hidden = true;
            anyVisible = false;
          }
          return;
        }
        anyVisible = false;
        const scale = Math.min(zoom, 8);
        for (const sprite of sprites) {
          const {site, image} = sprite;
          const distance = Math.hypot(shipX - site.x, shipY - site.y);
          const opacity = Math.round(100 * detail * (1 - smooth(site.near, site.far, distance))) / 100;
          if (!opacity) {
            if (!image.hidden) image.hidden = true;
            continue;
          }

          const {x, y} = project(site.x, site.y, true);
          const margin = 72;
          if (!(x > -margin && x < width + margin && y > -margin && y < height + margin)) {
            if (!image.hidden) image.hidden = true;
            continue;
          }

          if (!sprite.requested) {
            image.src = root + site.kind + '-v3.webp';
            sprite.requested = true;
          }
          const displayWidth = Math.round(site.width * scale);
          const transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-97%)`;
          if (sprite.width !== displayWidth) {
            image.style.width = displayWidth + 'px';
            sprite.width = displayWidth;
          }
          if (sprite.opacity !== opacity) {
            image.style.opacity = opacity;
            sprite.opacity = opacity;
          }
          if (sprite.transform !== transform) {
            image.style.transform = transform;
            sprite.transform = transform;
          }
          if (image.hidden) image.hidden = false;
          anyVisible = true;
        }
      }
    };
  }

  window.ROTTA_LISBON_SCENERY = {mount};
})();

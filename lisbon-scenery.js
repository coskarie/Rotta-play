(() => {
  const root = 'assets/europe/scenery/';
  const imageSize = 128;
  // At Lisbon, one world unit is about 403 metres. Footprints stay in world
  // coordinates so they shrink with the terrain instead of acting like port icons.
  const sites = [
    {id: 'lisbon-old-town', x: 4926.8, y: 13696.2, width: 5.1, height: 3.8, near: 37, far: 72},
    {id: 'lisbon-riverside', x: 4930.8, y: 13694.7, width: 3.3, height: 2.5, near: 39, far: 74},
    {id: 'tagus-hamlet', x: 4879.5, y: 13700.5, width: 1.26, height: .90, near: 17, far: 46},
    {id: 'tagus-lookout', x: 4854.5, y: 13684.5, width: .17, height: .15, near: 36, far: 67}
  ];

  function smooth(start, end, value) {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  }

  // Map the raster onto four projected ground corners. The CSS matrix divides
  // by W, matching the chart perspective even when the ground slopes.
  function transformForQuad(a, b, c, d) {
    const bx = b.x - c.x, by = b.y - c.y;
    const dx = d.x - c.x, dy = d.y - c.y;
    const skewX = a.x - b.x + c.x - d.x;
    const skewY = a.y - b.y + c.y - d.y;
    const determinant = bx * dy - dx * by;
    if (!(determinant < -1e-6)) return '';
    const perspectiveX = (skewX * dy - dx * skewY) / determinant;
    const perspectiveY = (bx * skewY - skewX * by) / determinant;
    const divide = 1 / imageSize;
    const values = [
      (b.x * (1 + perspectiveX) - a.x) * divide,
      (b.y * (1 + perspectiveX) - a.y) * divide, 0, perspectiveX * divide,
      (d.x * (1 + perspectiveY) - a.x) * divide,
      (d.y * (1 + perspectiveY) - a.y) * divide, 0, perspectiveY * divide,
      0, 0, 1, 0,
      a.x, a.y, 0, 1
    ];
    return 'matrix3d(' + values.map(value => value.toFixed(8)).join(',') + ')';
  }

  function mount(overlay, project) {
    const layer = document.createElement('div');
    layer.className = 'coastal-scenery';
    layer.setAttribute('aria-hidden', 'true');
    overlay.prepend(layer);

    const patches = sites.map(site => {
      const image = document.createElement('img');
      image.dataset.scene = site.id;
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      image.hidden = true;
      image.width = image.height = imageSize;
      layer.append(image);
      const left = site.x - site.width / 2, right = site.x + site.width / 2;
      const top = site.y - site.height / 2, bottom = site.y + site.height / 2;
      const corners = [[left, top], [right, top], [right, bottom], [left, bottom]];
      return {site, image, corners, opacity: -1, transform: '', requested: false};
    });

    return {
      update(shipX, shipY, zoom, width, height) {
        const detail = smooth(2.8, 4.8, zoom);
        for (const patch of patches) {
          const {site, image, corners} = patch;
          const distance = Math.hypot(shipX - site.x, shipY - site.y);
          const opacity = Math.round(100 * detail * (1 - smooth(site.near, site.far, distance))) / 100;
          if (!opacity) {
            if (!image.hidden) image.hidden = true;
            continue;
          }

          const {x, y} = project(site.x, site.y, true);
          const margin = 90;
          const visible = x > -margin && x < width + margin && y > -margin && y < height + margin;
          const transform = visible ? transformForQuad(...corners.map(([x, y]) => project(x, y, true))) : '';
          if (!transform) {
            if (!image.hidden) image.hidden = true;
            continue;
          }

          if (!patch.requested) {
            image.src = root + site.id + '-v2.webp';
            patch.requested = true;
          }
          if (patch.opacity !== opacity) {
            image.style.opacity = opacity;
            patch.opacity = opacity;
          }
          if (patch.transform !== transform) {
            image.style.transform = transform;
            patch.transform = transform;
          }
          if (image.hidden) image.hidden = false;
        }
      }
    };
  }

  window.ROTTA_LISBON_SCENERY = {mount};
})();

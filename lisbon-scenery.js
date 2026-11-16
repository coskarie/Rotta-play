(() => {
  const root = 'assets/europe/scenery/';
  // Game scenery inspired by the Tagus coast. Anchors are inland on the sailing chart.
  const sites = [
    {id: 'merchant-quarter', x: 4919.5, y: 13696.5, width: 22, maxWidth: 150, near: 33, far: 68},
    {id: 'fishing-hamlet', x: 4879.5, y: 13700.5, width: 14, maxWidth: 104, near: 17, far: 46},
    {id: 'headland-watch', x: 4854.5, y: 13684.5, width: 8, maxWidth: 66, near: 36, far: 67}
  ];

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
      image.dataset.scene = site.id;
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      image.hidden = true;
      layer.append(image);
      return {site, image, opacity: -1, width: -1, transform: '', requested: false};
    });

    return {
      update(shipX, shipY, zoom, width, height) {
        const detail = smooth(2.2, 3.8, zoom);
        for (const sprite of sprites) {
          const {site, image} = sprite;
          const distance = Math.hypot(shipX - site.x, shipY - site.y);
          const opacity = Math.round(100 * detail * (1 - smooth(site.near, site.far, distance))) / 100;
          if (!opacity) {
            if (!image.hidden) image.hidden = true;
            continue;
          }

          const {x, y} = project(site.x, site.y, true);
          const margin = site.maxWidth * 1.3;
          if (!(x > -margin && x < width + margin && y > -margin && y < height + margin)) {
            if (!image.hidden) image.hidden = true;
            continue;
          }

          if (!sprite.requested) {
            image.src = root + site.id + '-v1.webp';
            sprite.requested = true;
          }
          const displayWidth = Math.min(site.maxWidth, Math.round(site.width * zoom));
          const transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-94%)`;
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
        }
      }
    };
  }

  window.ROTTA_LISBON_SCENERY = {mount};
})();

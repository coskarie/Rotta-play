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

  // Build around individual lanes. Frontages sit on either side of each lane
  // with a small setback, so a bend in the path also bends the building line.
  // Local nudges leave space where frontages on different streets meet.
  const layout = [
    {id: 'western-headland', x: 4859.6, y: 13690.8, near: 34, far: 73, nudge: {3: [0,-.4], 6: [.4,.4], 10: [-.6,-.6]}, lanes: [
      [[[-3.4,1.2],[-1.6,.1],[.7,.22],[2.0,-.7],[3.6,-1.15]], [[-1.10,'THOGH'],[1.18,'CFBCC']]],
      [[[.7,.22],[1.3,1.65],[3.6,2]], [[1.05,'FCW']]]
    ]},
    {id: 'west-fishing-landing', x: 4881.5, y: 13699.5, near: 26, far: 61, nudge: {8: [.4,0], 10: [-.2,.6]}, lanes: [
      [[[-3.5,.65],[-.8,.34],[.45,-.56],[3.8,-.3]], [[-1.06,'HCGOH'],[1.15,'CFBWC']]],
      [[[.45,-.56],[.15,-1.8],[-.75,-2.8],[-3.1,-2.9]], [[.98,'GCHH']]]
    ]},
    {id: 'north-quay', x: 4895.5, y: 13698.7, near: 37, far: 70, lanes: [
      [[[-4.3,1.2],[-2.4,.1],[0,.25],[1.35,-.9],[3.9,-.75]], [[-1.11,'GHOGH'],[1.04,'BWFCW']]],
      [[[-2.4,.1],[-1.4,-1.48],[-.2,-2.4],[3.3,-2.25]], [[-.96,'OCHGO']]]
    ]},
    {id: 'lisbon-waterfront', x: 4909.8, y: 13698.0, near: 45, far: 80, nudge: {13: [.4,.4]}, court: [[-1.6,.44],[.2,.33]], lanes: [
      [[[-5.1,.85],[-2.6,.4],[0,.5],[1.5,-.16],[4.9,-.65]], [[-1.20,'HOHGCH'],[1.15,'WBHFWOC']]],
      [[[-1,.46],[-.8,-1.45],[.55,-2.55],[4.6,-3.35]], [[-.97,'GHOHGO']]]
    ]},
    {id: 'north-east-cove', x: 4927.0, y: 13692.4, near: 40, far: 78, nudge: {10: [-.2,-1]}, lanes: [
      [[[-3.9,1.5],[-.6,1.25],[1.4,-.2],[3.55,-1.6]], [[-1.05,'GHOGH'],[1.16,'WBCOF']]],
      [[[-.6,1.25],[-1.1,-.52],[-2.5,-2.66],[-4.1,-2.75]], [[.95,'GCO']]]
    ]},
    {id: 'south-mouth', x: 4919.0, y: 13727.3, near: 32, far: 71, nudge: {8: [.6,0]}, lanes: [
      [[[-2.7,-2.3],[-1.31,-.55],[-.7,1.6],[1.2,3]], [[-1.02,'GOHC'],[1.15,'FBCF']]],
      [[[-1.31,-.55],[.5,-1.45],[2.4,-1.33],[3.9,-.15]], [[-.95,'CHG']]]
    ]},
    {id: 'south-landing', x: 4933.4, y: 13720.4, near: 40, far: 77, court: [[-2.25,-.48],[-.65,-.6]], lanes: [
      [[[-4,-.95],[-1.8,-.38],[.5,-1],[3.55,-2.1]], [[-1.06,'WBHWF'],[1.12,'GHOCG']]],
      [[[-1.8,-.38],[-1.05,.95],[.75,1.9],[3.8,2.2]], [[1.01,'OCHFGC']]]
    ]},
    {id: 'east-south-bank', x: 4950.4, y: 13712.1, near: 39, far: 77, nudge: {9: [.4,.2]}, lanes: [
      [[[-3.2,1.8],[-1.2,1.3],[.55,.16],[2.9,-1.4]], [[-1.07,'OHCF'],[1.12,'HGCBO']]],
      [[[-1.2,1.3],[-.55,2.65],[1.1,3.7],[3,4]], [[1.02,'CFC']]]
    ]}
  ].map(prepareSite);

  function prepareSite(site) {
    const world = ([x, y]) => [site.x + x, site.y + y];
    const buildings = [];
    const roads = [];
    for (const [path, frontages] of site.lanes) {
      const points = path.map(world);
      const segments = points.slice(1).map(([x, y], index) => {
        const [x0, y0] = points[index];
        const dx = x - x0, dy = y - y0;
        return {x: x0, y: y0, dx, dy, length: Math.hypot(dx, dy)};
      });
      const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
      for (const [setback, kinds] of frontages) {
        [...kinds].forEach((kind, index) => {
          let distance = totalLength * (.04 + .92 * (index + .5) / kinds.length);
          let segment = segments[0];
          for (const next of segments) {
            segment = next;
            if (distance <= segment.length) break;
            distance -= segment.length;
          }
          const {x, y, dx, dy, length} = segment;
          const [asset, width] = types[kind];
          const offset = setback + ((index % 3) - 1) * .12;
          const [shiftX, shiftY] = site.nudge?.[buildings.length] ?? [0, 0];
          buildings.push({
            asset, width, x: x + (dx * distance - dy * offset) / length + shiftX,
            y: y + (dy * distance + dx * offset) / length + shiftY
          });
        });
      }
      // Samples every chart unit keep the drawn road close to the relief mesh.
      const samples = segments.flatMap(({x, y, dx, dy, length}) => {
        const count = Math.ceil(length);
        return Array.from({length: count}, (_, i) => [x + dx * i / count, y + dy * i / count]);
      });
      roads.push([...samples, points.at(-1)]);
    }
    return {...site, buildings, roads, court: site.court?.map(world) ?? []};
  }

  function smooth(start, end, value) {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  }

  const svgNamespace = 'http://www.w3.org/2000/svg';
  function createPath(parent, className) {
    const element = document.createElementNS(svgNamespace, 'path');
    element.setAttribute('class', className);
    parent.append(element);
    return element;
  }

  function createGroup(layer, ground, site) {
    const surface = document.createElementNS(svgNamespace, 'g');
    ground.append(surface);
    const court = createPath(surface, 'settlement-court');
    const roadEdge = createPath(surface, 'settlement-road-edge');
    const road = createPath(surface, 'settlement-road');
    const shadows = createPath(surface, 'settlement-contact');
    const group = document.createElement('div');
    group.dataset.settlement = site.id;
    const sprites = site.buildings.map(site => {
      const image = document.createElement('img');
      image.dataset.scene = site.asset;
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      image.src = root + site.asset + '-v4.webp';
      group.append(image);
      return {site, image, opacity: -1, width: -1, depth: -1, transform: ''};
    });
    layer.append(group);
    return {group, sprites, surface, court, roadEdge, road, shadows, groundKey: '', opacity: -1};
  }

  function pathData(points, project) {
    let data = '';
    let command = 'M';
    for (const [x, y] of points) {
      const point = project(x, y);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        command = 'M';
        continue;
      }
      data += command + point.x.toFixed(1) + ',' + point.y.toFixed(1);
      command = 'L';
    }
    return data;
  }

  function contactShadow(x, y, width) {
    const rx = (width * .41).toFixed(1), ry = (width * .11).toFixed(1);
    const diameter = (2 * Number(rx)).toFixed(1);
    return `M${(x - Number(rx)).toFixed(1)},${(y - .25).toFixed(1)}a${rx},${ry} 0 1,0 ${diameter},0a${rx},${ry} 0 1,0 -${diameter},0Z`;
  }

  function mount(overlay, project) {
    const layer = document.createElement('div');
    layer.className = 'coastal-scenery';
    layer.setAttribute('aria-hidden', 'true');
    const ground = document.createElementNS(svgNamespace, 'svg');
    ground.setAttribute('class', 'settlement-ground');
    layer.append(ground);
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
            if (entry.view && !entry.view.group.hidden) {
              entry.view.group.hidden = true;
              entry.view.surface.setAttribute('display', 'none');
            }
            continue;
          }

          const view = entry.view ??= createGroup(layer, ground, site);
          const {group, sprites, surface} = view;
          if (group.hidden) {
            group.hidden = false;
            surface.removeAttribute('display');
          }
          let shadows = '';
          for (const sprite of sprites) {
            const {site: building, image} = sprite;
            const {x, y, depth} = project(building.x, building.y);
            const visible = Number.isFinite(x) && Number.isFinite(y);
            if (image.hidden === visible) image.hidden = !visible;
            if (!visible) continue;

            const displayWidth = Math.round(building.width * scale) / 2;
            const order = Math.round(depth * 200);
            shadows += contactShadow(x, y, displayWidth);
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
          if (view.opacity !== opacity) {
            surface.setAttribute('opacity', opacity);
            view.opacity = opacity;
          }
          const groundKey = scale + ':' + shadows;
          if (view.groundKey !== groundKey) {
            const roads = site.roads.map(points => pathData(points, project)).join('');
            view.road.setAttribute('d', roads);
            view.roadEdge.setAttribute('d', roads);
            view.court.setAttribute('d', pathData(site.court, project));
            view.road.setAttribute('stroke-width', (scale * .32).toFixed(1));
            view.roadEdge.setAttribute('stroke-width', (scale * .65).toFixed(1));
            view.court.setAttribute('stroke-width', (scale * 1.1).toFixed(1));
            view.shadows.setAttribute('d', shadows);
            view.groundKey = groundKey;
          }
        }
      }
    };
  }

  window.ROTTA_LISBON_SCENERY = {mount,exclusions:layout.map(({x,y})=>({x,y,radius:9}))};
})();

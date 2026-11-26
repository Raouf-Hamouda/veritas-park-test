/* VERITAS, the place in three dimensions. Third version (22 Nov 2026, late): the model now stands on the real ground.
   Needs lib/three.min.js (three.js r149) and site_map.js.

   SOURCES.
   The ground: OpenStreetMap, fetched 22 Nov 2026 (site_map.js): the true outline of every building, the Stepenitz and the harbour of the Elbe,
   the streets, the railway, the green, the rows of trees, the two chimneys, the clock tower (49.40 m on the map).
   The numbers of the buildings and the six quarters: the plan of the live site (img/plan.jpg), laid on the map: turned half round,
   0.4545 m per pixel, its "U" on the clock tower. Checked: each number of the plan falls in its real outline.
   Heights: the floor counts of the plan. What each building becomes: the press read on 20 Nov and the floor plans of the live site.
   Names and lists of the quarters: the Urbanotop map of the live site; their colours: the bright shades of the brand book.
   Which quarter covers which part of the plan is MY READING of that map. Every colour is a shade of the book or a mix of two.

   WHAT IT DOES. The site stands, in the colours of its quarters, on a round white model of the town: a dial with its twelve ticks.
   Arrival: the town, then the quarters one after the other, the tower last. Drag: turn. Pinch, ctrl + wheel, double click or the buttons: zoom.
   Choosing a quarter or a building flies there and says what it holds. Building 13 opens floor by floor; each floor leads to its plan.
   The sun stands where it stands in Wittenberge at this hour, the windows light up in the evening, the water moves, the clock of the tower runs. */
(() => {
  const T = window.THREE, MAP = window.VERITAS_MAP, UP = 1.15;   // UP: heights drawn a little taller so the fronts read from above
  const rad = d => d * Math.PI / 180, lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out = t => 1 - Math.pow(1 - t, 3);
  const PX = ([x, y]) => [-(x - 811) * .4545, (y - 519) * .4545];   // a point of the plan -> metres east and north of the tower
  const pairs = f => { const o = []; for (let i = 0; i < f.length; i += 2) o.push([f[i], f[i + 1]]); return o };
  const area = p => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1] } return a / 2 };
  const centroid = p => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
  const inside = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c };
  // what is left of an outline on one side of a straight line (a x + b y <= c): used to cut the long factory into its numbered buildings
  const cut = (p, a, b, c) => { const o = []; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length], dp = a * p[i][0] + b * p[i][1] - c, dq = a * q[0] + b * q[1] - c; if (dp <= 0) o.push(p[i]); if ((dp < 0) !== (dq < 0) && dp !== dq) { const t = dp / (dp - dq); o.push([p[i][0] + (q[0] - p[i][0]) * t, p[i][1] + (q[1] - p[i][1]) * t]) } } return o };
  const HUE = {  // bright, muted, dark, pastel: the table of the book
    green: ['#58B560', '#769F79', '#2A362B', '#E1E9E2'], brown: ['#FF6633', '#B46348', '#4B2113', '#FFE9E1'], turquoise: ['#5FD1E1', '#668589', '#213E42', '#DBECEE'],
    ocher: ['#FFFF80', '#B4B487', '#4D4D3D', '#F7F7E1'], purple: ['#8E7FFD', '#817CA4', '#333048', '#E4E2F6'], violet: ['#FF80FF', '#9A6C9A', '#3D213D', '#FCECFC'], soft: ['#BEE272', '#889A61', '#434B32', '#EAEEE1'] };
  const ZONES = [   // outlines drawn on the plan, then carried to the map
    { id: 'factory', hue: 'turquoise', name: 'Future Factory', text: 'Offices, Restaurants, Co-working spaces, Conference Center, Hotel', at: [900, 418], poly: [[590, 310], [1160, 285], [1245, 540], [930, 585], [635, 600]] },
    { id: 'culture', hue: 'ocher', name: 'Art & Culture Hub', text: 'Museum, Artist Studios, Sports, Events, Music, Restaurant, Cafés', at: [1010, 190], poly: [[560, 100], [1065, 45], [1160, 285], [590, 310], [590, 205]] },
    { id: 'creative', hue: 'brown', name: 'Creative Quarter', text: 'Serviced Apartments, Laboratories, Workshops', at: [850, 700], poly: [[635, 600], [930, 585], [1245, 540], [1160, 700], [915, 765], [640, 840]] },
    { id: 'park', hue: 'green', name: 'Sustainable Park', text: 'Serviced Apartments, Green space', at: [1330, 330], poly: [[1065, 45], [1385, 15], [1455, 225], [1480, 600], [1245, 540], [1160, 285]] },
    { id: 'industrial', hue: 'purple', name: 'Light Industrial & Logistics', text: '', at: [330, 610], poly: [[62, 230], [590, 205], [590, 310], [635, 600], [640, 840], [275, 940], [215, 640], [80, 640]] },
    { id: 'harbour', hue: 'violet', name: 'Inspiration Harbour', text: 'Hotel, Conferences, Leisure', at: [300, 160], poly: [[48, 112], [330, 48], [560, 18], [560, 100], [590, 205], [62, 230]] }
  ].map(z => ({ ...z, poly: z.poly.map(PX), at: PX(z.at) }));
  /* What the plan and the press say of the buildings. at: a point of the plan inside the building. h: height in metres, from the floor counts of the plan. */
  const KNOWN = [
    { n: '13', at: [985, 470], h: 26, wall: 'render', label: 'Building 13, the hotel', use: 'Hotel with 140 rooms, offices and co-working, lobby bar, spa, rooftop bar.' },
    { n: '23', at: [817, 485], h: 26, wall: 'render' }, { n: '46', at: [707, 488], h: 22, wall: 'render' },
    { n: '7', at: [865, 360], h: 22, wall: 'brick', label: 'Building 7, work spaces', use: 'Work spaces. The first big hall of the factory, 1907.' },
    { n: '6', at: [1115, 356], h: 18, wall: 'brick' }, { n: '14', at: [1161, 461], h: 9, wall: 'render', label: 'Building 14, conference hall', use: 'Conference and performance hall, in the old canteen.' },
    { n: '2', at: [880, 246], h: 19, wall: 'brick', label: 'Building 2, events and club', use: 'Event room, club, photo studio, in the old power house.' },
    { n: '4', at: [740, 128], h: 13, wall: 'brick', label: 'Building 4, sport', use: 'Sport, co-working, a restaurant on the water.' },
    { n: '8', at: [670, 266], h: 9, wall: 'brick', label: 'Building 8, museum', use: 'Photography museum or another place for art.' },
    { n: '11', at: [1038, 245], h: 9, wall: 'brick' }, { n: '110', at: [553, 350], h: 10, label: 'Buildings 101 to 113', use: 'Light industry and logistics.' }, { n: '117', at: [425, 427], h: 12 },
    { n: '100', at: [430, 820], h: 7 }, { n: '9', at: [1167, 116], h: 8 }, { n: '12', at: [794, 556], h: 5.5 }, { n: '60', at: [697, 562], h: 5 }, { n: '59', at: [708, 656], h: 7 }, { n: '48', at: [765, 652], h: 7 },
    { n: '98', at: [152, 556], h: 6 }, { n: '107', at: [790, 753], h: 7 }, { n: '51', at: [580, 531], h: 5 }, { n: '30', at: [513, 694], h: 5 }].map(k => ({ ...k, at: PX(k.at) }));
  const FLOORS13 = ['Basement', 'Ground Floor: Lobby Bar and Conference Centre', 'First Floor: Office and Co-working Space', 'Second Floor: Office Hotel', 'Third Floor: Hotel', 'Fourth Floor: Hotel', 'Fifth Floor: Hotel Restaurant with Panoramic View', 'Rooftop Bar'];
  const FLOOR_PLAN = [8, 7, 5, 4, 3, 2, 1, 0];   // which plan of the Rent page each floor opens
  const WORKS = 264138438;   // the two long bars of the factory are one outline on the map; the plan says where 13, 23, 46 and 7 begin and end

  function mount(stage) {
    const canvas = stage.querySelector('canvas'), old = stage.parentNode.querySelector('.zones'); if (old) old.remove();
    let renderer; try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }) } catch (e) { stage.classList.add('flat'); stage.innerHTML = '<img src="img/urbanotop_map.jpg" alt="The six quarters of VERITAS">'; return }
    const lite = matchMedia('(pointer:coarse)').matches || innerWidth < 820;   // a phone or a tablet: a lighter model
    renderer.setPixelRatio(lite ? 1 : Math.min(devicePixelRatio || 1, 1.25)); let DPR_MOVE = lite ? 1 : Math.min(devicePixelRatio || 1, 1.25), DPR_REST = Math.min(devicePixelRatio || 1, lite ? 2.5 : 2), dprNow = DPR_MOVE, touched = 0; renderer.shadowMap.enabled = !lite; renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
    const scene = new T.Scene(), cam = new T.OrthographicCamera(-1, 1, 1, -1, 900, 3600);
    const amb = new T.AmbientLight(0xffffff, .4), sun = new T.DirectionalLight(0xffffff, .8), fill = new T.DirectionalLight(0xffffff, .2); sun.castShadow = !lite;
    Object.assign(sun.shadow.camera, { left: -640, right: 640, top: 640, bottom: -640, near: 300, far: 2200 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048); sun.shadow.bias = -.0007; sun.shadow.normalBias = .6;
    scene.add(amb, sun, sun.target, fill);
    const C = h => new T.Color(h), mix = (a, b, t) => C(a).lerp(C(b), t), M4 = new T.Matrix4(), Q = new T.Quaternion(), V = new T.Vector3(), V2 = new T.Vector3(), EUL = new T.Euler();
    let dirty = true, shadowDirty = true, open13 = 0;
    const api = { hooks: [], evening: 0, sites: [] };   // what the detail modules (urb_*.js) are handed
    const shapeOf = p => new T.Shape(p.map(([x, y]) => new T.Vector2(x, y)));
    const lay = (m, y) => { m.rotation.x = -Math.PI / 2; m.position.y = y; return m };   // a drawing made flat on the map (x east, y north) is laid on the ground of the model
    const flat = (p, material, y) => { const m = lay(new T.Mesh(new T.ShapeGeometry(shapeOf(p)), material), y); m.receiveShadow = true; return m };

    /* ---------- the model's plate: a round white town, a dial with its twelve ticks */
    const R = 640, town = new T.Group(); town.scale.y = .0001; scene.add(town);
    const plate = lay(new T.Mesh(new T.CircleGeometry(R, 120), new T.MeshLambertMaterial({ color: '#F1EFEB' })), -.6); plate.receiveShadow = true; scene.add(plate);
    const slab = new T.Mesh(new T.CylinderGeometry(R + 74, R + 78, 18, 120), new T.MeshLambertMaterial({ color: '#FBFAF8' })); slab.position.y = -9.7; slab.receiveShadow = true; scene.add(slab);   // the base of the model
    scene.add(lay(new T.Mesh(new T.RingGeometry(R, R + 5, 120), new T.MeshLambertMaterial({ color: '#d9d7d3' })), -.55));
    const tickMat = new T.MeshLambertMaterial({ color: '#161412' }); for (let h = 0; h < 12; h++) { const tk = new T.Mesh(new T.BoxGeometry(7, 1.2, 46), tickMat); tk.position.set(Math.sin(rad(h * 30)) * (R + 40), -.2, -Math.cos(rad(h * 30)) * (R + 40)); tk.rotation.y = -rad(h * 30); scene.add(tk) }
    const onPlate = p => p.some(([x, y]) => Math.hypot(x, y) < R - 6), clipPlate = p => { let q = p; for (let k = 0; k < 60 && q.length > 2; k++) { const a = k / 60 * 2 * Math.PI; q = cut(q, Math.cos(a), Math.sin(a), R - 2) } return q };

    /* ---------- the stuff the factory is made of, drawn once: brick in courses, lime render with its streaks, bitumen roofs with their patches.
       Every tone is a mix of the browns and ochres of the book. A picture covers a few metres and repeats. */
    let ts = 1904; const tr = () => (ts = (ts * 16807) % 2147483647) / 2147483647, tone = (c, v) => C(c).multiplyScalar(v).getStyle();
    const paint = (metres, draw) => { const c = document.createElement('canvas'); c.width = c.height = 256; draw(c.getContext('2d')); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1 / metres, 1 / metres); t.anisotropy = 4; return t };
    const BRICK = C('#E8E5E0'), MORTAR = C('#FFFFFF'), LIME = C('#FFFFFF'), TAR = C('#F4F2EE');
    const brickTex = paint(6, x => { x.fillStyle = MORTAR.getStyle(); x.fillRect(0, 0, 256, 256); for (let r = 0; r < 18; r++) for (let c = -1; c < 9; c++) { x.fillStyle = tone(BRICK, .8 + tr() * .34); x.fillRect(c * 32 + (r % 2) * 16 + 1, r * 14.22 + 1, 30, 12.4) } });
    const limeTex = paint(14, x => { x.fillStyle = LIME.getStyle(); x.fillRect(0, 0, 256, 256); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${tr() < .5 ? '90,80,60' : '255,255,255'},${.03 + tr() * .05})`; x.fillRect(tr() * 256, 0, 4 + tr() * 26, 256) }
      for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(70,60,45,.05)'; x.fillRect(tr() * 256, tr() * 256, 20 + tr() * 60, 2 + tr() * 5) } });
    const tarTex = paint(40, x => { x.fillStyle = TAR.getStyle(); x.fillRect(0, 0, 256, 256); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${tr() < .5 ? '30,30,26' : '255,252,244'},${.03 + tr() * .05})`; x.fillRect(tr() * 256, tr() * 256, 1 + tr() * 3, 1 + tr() * 3) }
      for (let i = 0; i < 12; i++) { x.fillStyle = `rgba(30,30,26,${.015 + tr() * .03})`; x.fillRect(tr() * 200, tr() * 200, 24 + tr() * 50, 18 + tr() * 36) }
      x.strokeStyle = 'rgba(30,30,26,.12)'; x.lineWidth = 1; for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke() } });
    /* ---------- the quarters: their grounds and their own materials. Everything of a quarter fades together when another one is chosen. */
    const zones = {}, picks = [];
    const mat = (zone, colour, opt = {}) => { const m = new T.MeshLambertMaterial({ color: C(colour), ...opt }); m.userData.base = m.color.clone(); m.userData.pale = mix(zone.pastel, '#ffffff', .4); m.userData.wash = !!opt.map; zone.mats.push(m); return m };
    for (const z of ZONES) {
      const [bright, muted, dark, pastel] = HUE[z.hue], Z = zones[z.id] = { ...z, k: 0, to: 0, mats: [], rise: -1, group: new T.Group(), inst: {}, bright, muted, dark, pastel };
      Z.ground = mat(Z, mix(bright, '#ffffff', .16)); const g = flat(z.poly, Z.ground, .12); g.userData.zone = z.id; scene.add(g); picks.push(g);
      Z.brick = mat(Z, mix(pastel, muted, .16), { map: brickTex }); Z.render = mat(Z, mix(pastel, '#ffffff', .35), { map: limeTex }); Z.plain = mat(Z, mix(pastel, muted, .12), { map: limeTex }); Z.roof = mat(Z, mix(pastel, '#ffffff', .55), { map: tarTex });
      Z.trim = mat(Z, '#ffffff'); Z.deep = mat(Z, mix(dark, muted, .2));
      Z.group.scale.y = .0001; scene.add(Z.group);
    }
    const zoneAt = (x, y) => { for (const z of ZONES) if (inside(x, y, z.poly)) return zones[z.id]; return null };

    /* ---------- windows: one pane of glass in its frame with its glazing bars, drawn once, then set bay after bay and floor after floor along every wall */
    const pane = glow => { const c = document.createElement('canvas'); c.width = 96; c.height = 80; const x = c.getContext('2d'); x.fillStyle = glow ? '#000' : '#f4f1ea'; x.fillRect(0, 0, 96, 80); x.fillStyle = glow ? '#fff' : '#2b3136'; x.fillRect(6, 6, 84, 68);
      x.strokeStyle = glow ? '#000' : '#ddd8cc'; x.lineWidth = 2.5; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(6 + 21 * i, 6); x.lineTo(6 + 21 * i, 74); x.stroke() } for (let j = 1; j < 3; j++) { x.beginPath(); x.moveTo(6, 6 + 68 * j / 3); x.lineTo(90, 6 + 68 * j / 3); x.stroke() }
      const t = new T.CanvasTexture(c); t.anisotropy = 4; return t };
    const glassMap = pane(false), glowMap = pane(true), glass = [];
    const windowMat = (zone, lit) => { const m = new T.MeshLambertMaterial({ map: glassMap, emissiveMap: glowMap, emissive: mix(HUE.ocher[0], HUE.brown[3], .45), emissiveIntensity: 0 }); m.userData.base = C('#ffffff'); m.userData.pale = mix(zone.pastel, '#ffffff', .2); zone.mats.push(m); if (lit) glass.push(m); return m };
    const place = (bag, kind, x, y, z, sx, sy, sz, ry = 0, tint) => { M4.compose(V.set(x, y, z), Q.setFromEuler(EUL.set(0, ry, 0)), V2.set(sx, sy, sz)); (bag[kind] = bag[kind] || []).push([M4.clone(), tint]) };
    // every wall of an outline: bays of about 4.6 m, floors of about 4.3 m; piers stand between the bays of the long walls. A wall born of a cut carries nothing.
    let ws = 7; const wr = () => (ws = (ws * 16807) % 2147483647) / 2147483647;
    function fronts(bag, p, h, y0, piers, isCut) {
      const ccw = area(p) > 0, nf = Math.max(1, Math.round(h / (4.3 * UP))), fh = h / nf;
      for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 5.2 || (isCut && isCut(a, b))) continue;
        const ux = dx / len, uy = dy / len, ox = ccw ? uy : -uy, oy = ccw ? -ux : ux, ry = Math.atan2(ox, -oy), nb = Math.floor((len - 1.2) / 4.6), bw = len / nb;
        for (let k = 0; k < nb; k++) { const t = bw * (k + .5), x = a[0] + ux * t + ox * .07, y = a[1] + uy * t + oy * .07;
          for (let f = 0; f < nf; f++) place(bag, wr() < .2 ? 'winlit' : 'win', x, y0 + fh * (f + .52), -y, bw * .76, fh * .66, 1, ry, new T.Color().setScalar(.7 + wr() * .42));
          if (piers && len > 28 && k) place(bag, 'pier', a[0] + ux * (t - bw / 2) + ox * .2, y0 + h / 2, -(a[1] + uy * (t - bw / 2) + oy * .2), .8, h, .5, ry) } }
    }
    const edges = [];
    // a solid standing on its real outline. Its lid takes the roof colour, its walls the wall colour.
    function solid(parent, p, y0, h, wallMat, roofMat, data, lineColour) {
      const geo = new T.ExtrudeGeometry(shapeOf(p), { depth: h, bevelEnabled: false }), m = lay(new T.Mesh(geo, [roofMat, wallMat]), y0); m.castShadow = m.receiveShadow = true; m.userData = data || {}; parent.add(m);
      if (lineColour) { const e = lay(new T.LineSegments(new T.EdgesGeometry(geo, 30), new T.LineBasicMaterial({ color: lineColour, transparent: true, opacity: .34 })), y0); e.userData.b = data && data.b; parent.add(e); edges.push(e) }
      return m;
    }
    // small roof lights set in rows on the large flat roofs
    function rooflights(bag, p, y) { if (Math.abs(area(p)) < 1500) return; const xs = p.map(q => q[0]), ys = p.map(q => q[1]); for (let x = Math.min(...xs) + 8; x < Math.max(...xs) - 6; x += 15) for (let yy = Math.min(...ys) + 8; yy < Math.max(...ys) - 6; yy += 13) if (inside(x, yy, p) && inside(x + 3, yy + 2, p) && inside(x - 3, yy - 2, p)) place(bag, 'sky', x, y + .5, -yy, 5, 1, 2.4) }
    /* ---------- everything queued bay by bay becomes one object per kind: thousands of windows, one draw */
    const unit = { win: new T.PlaneGeometry(1, 1), pier: new T.BoxGeometry(1, 1, 1), sky: new T.BoxGeometry(1, 1, 1), tree: new T.IcosahedronGeometry(1, 2), cone: new T.ConeGeometry(1, 1, 9), trunk: new T.CylinderGeometry(.22, .32, 1, 6) };
    unit.winlit = unit.win;
    function bake(zone, bag, parent, materials) {
      for (const kind in bag) { const all = bag[kind]; if (!all.length) continue;
        const material = materials && materials[kind] ? materials[kind] : kind === 'win' ? (zone.glass = zone.glass || windowMat(zone)) : kind === 'winlit' ? (zone.glassLit = zone.glassLit || windowMat(zone, true)) : kind === 'pier' ? zone.brick : kind === 'sky' ? zone.trim : zone.deep;
        const im = new T.InstancedMesh(unit[kind], material, all.length); all.forEach(([m, tint], i) => { im.setMatrixAt(i, m); if (tint) im.setColorAt(i, tint) }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = kind === 'sky'; im.receiveShadow = true; if (zone) im.userData.zone = zone.id; parent.add(im) }
    }

    /* ---------- the buildings: every outline of the map. Inside a quarter they take its colours and their windows; the town round them stays white. */
    const townByHeight = {}, info = {}, floors = [], whiteWall = new T.MeshLambertMaterial({ color: '#ECEBE8' }), whiteRoof = new T.MeshLambertMaterial({ color: '#ffffff' });
    const aoMat = new T.MeshBasicMaterial({ color: '#1B1A17', transparent: true, opacity: .15, depthWrite: false });
    const contact = p => { const c = centroid(p); scene.add(flat(p.map(q => { const d = Math.hypot(q[0] - c[0], q[1] - c[1]) || 1; return [q[0] + (q[0] - c[0]) / d * 2.6, q[1] + (q[1] - c[1]) / d * 2.6] }), aoMat, .08)) };
    const boxOf = (p, h) => { const b = new T.Box3(); p.forEach(([x, y]) => { b.expandByPoint(new T.Vector3(x, 0, -y)); b.expandByPoint(new T.Vector3(x, h, -y)) }); return b };
    function site(zone, p, k, isCut) {   // one building of the site, known from the plan or not
      if (p.length < 3) return; const h = (k ? k.h : 6.5) * UP, key = k ? k.n : null, wall = k && k.wall === 'brick' ? zone.brick : k && k.wall === 'render' ? zone.render : zone.id === 'industrial' ? zone.plain : zone.brick;
      api.sites.push({ p, h, zone, k, isCut });
      if (k) info[k.n] = { ...k, box: boxOf(p, h), zone };
      if (k && k.n === '13') {   // the hotel is built floor by floor so it can open
        const n = 6, fh = h / n; for (let f = 0; f <= n; f++) { const g = new T.Group(); zone.group.add(g); floors.push(g);
          if (f === n) { const lid = solid(g, p, h, .5, zone.roof, zone.roof, { zone: zone.id, b: key }); picks.push(lid); const bag = {}; rooflights(bag, p, h + .5); bake(zone, bag, g) }
          else { const s = solid(g, p, f * fh, fh - .14, zone.render, zone.trim, { zone: zone.id, b: key }, zone.dark); picks.push(s); const bag = {}; fronts(bag, p, fh, f * fh, false, isCut); bake(zone, bag, g) } }
        return }
      const m = solid(zone.group, p, 0, h, wall, zone.roof, { zone: zone.id, b: key }, zone.dark); picks.push(m); fronts(zone.inst, p, h, 0, k && k.wall === 'brick', isCut); rooflights(zone.inst, p, h);
    }
    const near = (v, c) => Math.abs(v - c) < .02, onCut = (a, b) => (near(a[1], -47) && near(b[1], -47)) || (near(a[0], -27) && near(b[0], -27)) || (near(a[0], 25) && near(b[0], 25));
    const known = n => KNOWN.find(q => q.n === n);
    for (const b of MAP.buildings) {
      const p = pairs(b.p); if (!onPlate(p)) continue; const [cx, cy] = centroid(p), zone = zoneAt(cx, cy);
      if (b.id === WORKS) {   // the long factory, cut where the plan says its numbered buildings meet
        const fz = zones.factory, north = cut(p, 0, -1, 47), south = cut(p, 0, 1, -47);
        site(fz, cut(north, 1, 0, -27), known('13'), onCut); site(fz, cut(cut(north, -1, 0, 27), 1, 0, 25), known('23'), onCut); site(fz, cut(north, -1, 0, -25), known('46'), onCut); site(fz, south, known('7'), onCut); continue }
      if (zone) { site(zone, p, KNOWN.find(q => inside(q.at[0], q.at[1], p))); continue }
      const hh = (b.h || (b.l ? b.l * 3.2 : { house: 7, detached: 7, apartments: 13, terrace: 8, garage: 3, garages: 3, roof: 4, school: 9, industrial: 7 }[b.t] || (Math.abs(area(p)) > 900 ? 8 : 6))) * UP;
      (townByHeight[Math.round(hh)] = townByHeight[Math.round(hh)] || []).push(shapeOf(p));
    }
    for (const hh in townByHeight) { const m = lay(new T.Mesh(new T.ExtrudeGeometry(townByHeight[hh], { depth: +hh, bevelEnabled: false }), [whiteRoof, whiteWall]), 0); m.castShadow = m.receiveShadow = true; town.add(m) }
    /* ---------- the clock tower, modelled on its photographs (img/place/b13_031.jpg, b7_213.jpg) and on the map (49.40 m, 11.6 by 9.6 m).
       A plain rendered shaft. On each face: a tall recessed bay with thin fins and five rows of windows between them; three small openings;
       the square of brick with its round dial, twelve white ticks and two pointed hands; then the crown with its three small windows,
       the flat top, the mast and the aerials. Heights in metres, as they are. */
    const fz = zones.factory, tower = new T.Group(), tc = centroid(pairs(MAP.tower).slice(0, 4)), tx = tc[0], tz = -tc[1], TW = 11.6, TD = 9.6, TH = 49.4; tower.scale.y = .0001; scene.add(tower);
    info.tower = { n: 'tower', label: 'The clock tower', use: 'Built in 1928, 49.40 m high. Its clock keeps the time of Wittenberge.', box: new T.Box3(new T.Vector3(tx - 7, 0, tz - 7), new T.Vector3(tx + 7, TH * UP, tz + 7)), zone: fz };
    const stone = mat(fz, mix(fz.pastel, '#ffffff', .4)), stoneDark = mat(fz, mix(fz.pastel, fz.muted, .3)), brickRed = mat(fz, mix(HUE.red ? HUE.red[1] : '#9A6464', HUE.brown[2], .55)), glassDark = mat(fz, mix(HUE.turquoise[2], '#000000', .35));
    const part = (material, w, h, d, x, y, z, pick) => { const m = new T.Mesh(new T.BoxGeometry(w, h * UP, d), material); m.position.set(tx + x, (y + h / 2) * UP, tz + z); m.castShadow = m.receiveShadow = true; m.userData = { zone: 'factory', b: 'tower' }; tower.add(m); if (pick) { picks.push(m);
        const e = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color: fz.dark, transparent: true, opacity: .34 })); e.position.copy(m.position); e.userData.b = 'tower'; tower.add(e); edges.push(e) } return m };
    part(stone, TW, 43.4, TD, 0, 0, 0, true);                                     // the shaft
    part(stoneDark, TW + .9, .7, TD + .9, 0, 43.4, 0, true);                      // the cornice under the crown
    part(stone, TW - .5, 3.6, TD - .5, 0, 44.1, 0, true);                         // the crown
    part(stoneDark, TW + .2, .55, TD + .2, 0, 47.7, 0, true);                     // its lid
    part(stone, TW - 2.4, .5, TD - 2.4, 0, 48.25, 0, false);                      // the flat top
    // each of the four faces: w = its width, (ux, uz) runs along it, (nx, nz) points out of it
    for (const [w, half, ux, uz, nx, nz] of [[TW, TD / 2, 1, 0, 0, 1], [TW, TD / 2, -1, 0, 0, -1], [TD, TW / 2, 0, -1, 1, 0], [TD, TW / 2, 0, 1, -1, 0]]) {
      const on = (material, across, h, deep, along, y, outBy) => part(material, Math.abs(ux) * across + Math.abs(nx) * deep, h, Math.abs(uz) * across + Math.abs(nz) * deep, ux * along + nx * (half + outBy), y, uz * along + nz * (half + outBy));
      const bay = w * .56, cols = 6, cw = bay / cols;
      on(stoneDark, bay, 26.5, .1, 0, 5, .02);                                    // the recessed bay, a shade darker
      for (let c = 0; c <= cols; c++) on(stone, .34, 26.5, .46, -bay / 2 + c * cw, 5, .2);              // its fins
      on(stone, bay + .9, .5, .6, 0, 31.5, .26); on(stone, bay + .9, .6, .6, 0, 4.4, .26);              // its head and its sill
      for (let c = 0; c < cols; c++) for (const [y, h] of [[6.4, 3.4], [11.6, 3.4], [16.8, 3.4], [22, 3.4], [27.2, 3.2]]) on(glassDark, cw * .56, h, .08, -bay / 2 + (c + .5) * cw, y, .1);   // five rows of windows
      for (const o of [-1, 0, 1]) { on(glassDark, w * .15, .95, .08, o * w * .2, 32.6, .04); on(glassDark, w * .1, 1.15, .08, o * w * .21, 45.2, -.2) }   // the openings under the dial, the windows of the crown
      on(brickRed, w * .76, 8.9, .12, 0, 33.9, .05);                              // the square of brick that carries the dial
    }
    for (const [x, z, h] of [[0, 0, 5.2], [-2.6, 1.6, 1.5], [2.4, -1.5, 1.2], [1.2, 2, .9]]) { const a = new T.Mesh(new T.CylinderGeometry(.09, .12, h * UP, 6), fz.deep); a.position.set(tx + x, (48.75 + h / 2) * UP, tz + z); tower.add(a) }   // the mast and the aerials
    // the dial, as on the photograph: a round of brick a little lighter than its square, twelve white ticks, two pointed hands, a square in the middle. The thin third hand is ours: it shows the seconds.
    const fc = document.createElement('canvas'); fc.width = fc.height = 512; const fx = fc.getContext('2d'), face = new T.CanvasTexture(fc); face.anisotropy = 8;
    const brickA = '#' + brickRed.userData.base.getHexString(), brickB = '#' + brickRed.userData.base.clone().lerp(C('#ffffff'), .1).getHexString(), white = '#F3F1EC';
    const handShape = (len, wide) => { fx.beginPath(); fx.moveTo(-wide * .45, 26); fx.lineTo(-wide, -len * .58); fx.lineTo(0, -len); fx.lineTo(wide, -len * .58); fx.lineTo(wide * .45, 26); fx.closePath(); fx.fill() };
    const drawFace = () => { const [hh, mm, ss] = window.veritasTime ? window.veritasTime() : [300, 60, 0]; fx.fillStyle = brickA; fx.fillRect(0, 0, 512, 512); fx.save(); fx.translate(256, 256);
      fx.strokeStyle = 'rgba(0,0,0,.16)'; fx.lineWidth = 1; for (let y = -256; y < 256; y += 9) { fx.beginPath(); fx.moveTo(-256, y); fx.lineTo(256, y); fx.stroke() }                 // the courses of the brick
      fx.fillStyle = brickB; fx.beginPath(); fx.arc(0, 0, 238, 0, 7); fx.fill(); fx.strokeStyle = 'rgba(0,0,0,.22)'; fx.lineWidth = 3; fx.stroke(); fx.beginPath(); fx.arc(0, 0, 150, 0, 7); fx.stroke();
      fx.fillStyle = white; for (let i = 0; i < 12; i++) { fx.save(); fx.rotate(i * Math.PI / 6); fx.fillRect(-12, -224, 24, 58); fx.restore() }
      for (const [deg, len, wide] of [[hh, 128, 20], [mm, 206, 14]]) { fx.save(); fx.rotate(rad(deg)); fx.shadowColor = 'rgba(0,0,0,.35)'; fx.shadowBlur = 8; fx.shadowOffsetY = 5; handShape(len, wide); fx.restore() }
      fx.save(); fx.rotate(rad(ss || 0)); fx.fillRect(-2, -214, 4, 250); fx.restore(); fx.fillRect(-17, -17, 34, 34); fx.restore(); face.needsUpdate = true; dirty = true };
    const dialMat = new T.MeshLambertMaterial({ map: face });
    for (const [w, half, nx, nz, ry] of [[TW, TD / 2, 0, 1, 0], [TW, TD / 2, 0, -1, Math.PI], [TD, TW / 2, 1, 0, Math.PI / 2], [TD, TW / 2, -1, 0, -Math.PI / 2]]) { const side = w * .76, dm = new T.Mesh(new T.PlaneGeometry(side, 8.9 * UP), dialMat); dm.position.set(tx + nx * (half + .13), 38.35 * UP, tz + nz * (half + .13)); dm.rotation.y = ry; tower.add(dm) }

    /* ---------- the chimneys of the map: a foot, a tapering shaft with its iron bands, a lip. The tall one is 70 m on the map. */
    for (const [x, y, hm] of MAP.chimneys) { if (Math.hypot(x, y) > 400) continue; const z = zoneAt(x, y) || zones.culture, h = (hm || 46) * UP, foot = new T.Mesh(new T.CylinderGeometry(3.3, 3.6, 5 * UP, 8), z.brick); foot.position.set(x, 2.5 * UP, -y);
      const shaft = new T.Mesh(new T.CylinderGeometry(1.5, 2.8, h - 5 * UP, 24), z.brick); shaft.position.set(x, 5 * UP + (h - 5 * UP) / 2, -y); const lip = new T.Mesh(new T.CylinderGeometry(1.8, 1.6, 1.2, 24), z.deep); lip.position.set(x, h + .5, -y);
      for (const m of [foot, shaft, lip]) { m.castShadow = true; z.group.add(m) } for (let i = 1; i < 8; i++) { const t = i / 8, r = lerp(2.8, 1.5, t) + .06, band = new T.Mesh(new T.CylinderGeometry(r, r, .35, 24), z.trim); band.position.set(x, 5 * UP + (h - 5 * UP) * t, -y); z.group.add(band) } }

    const b13 = info['13'].box;   // the letters on its roof: urb_sign.js
    /* ---------- the green of the map. The water, the streets, the railway and the trees are drawn by their own modules: urb_water.js, urb_ground.js, urb_rail.js, urb_trees.js */
    const greenCol = { park: '#DDEBD8', grass: '#E1ECDB', meadow: '#E3EDD9', scrub: '#D6E7D2', wood: '#CFE3CB', pitch: '#DCEBD6', playground: '#E6EFE0', allotments: '#DFEAD6' }, greens = [];
    for (const g of MAP.green) { const p = clipPlate(pairs(g.p)); if (p.length < 3) continue; scene.add(flat(p, new T.MeshLambertMaterial({ color: greenCol[g.k] || greenCol.grass }), .05)); greens.push({ p, k: g.k }) }
    const waters = MAP.water.map(w => clipPlate(pairs(w))).filter(p => p.length > 2), wood = new T.Group(); wood.scale.y = .0001; scene.add(wood);
    for (const id in zones) bake(zones[id], zones[id].inst, zones[id].group);

    /* ---------- what you read on it: the six quarters as a list, a card for what is chosen, a small name under the pointer, the buttons of the zoom */
    const ui = document.createElement('div'); ui.className = 'urb-ui'; const svgIco = d => `<svg class="ico" viewBox="0 0 100 100" aria-hidden="true">${d.map(p => `<path d="${p}"/>`).join('')}</svg>`;
    ui.innerHTML = `<ol class="urb-list">${ZONES.map(z => `<li><button type="button" data-zone="${z.id}" data-hue="${z.hue}"><span>${z.name}</span></button></li>`).join('')}</ol>
<div class="urb-card" hidden><button type="button" class="round urb-x" aria-label="Close">${svgIco(['M12.5 12.5L87.5 87.5', 'M87.5 12.5L12.5 87.5'])}</button><button type="button" class="urb-back">${svgIco(['M97.5 50H5', 'M37.5 17.5L5 50L37.5 82.5'])}<span></span></button><p class="urb-kick"></p><h3></h3><p class="urb-text"></p><ul class="urb-sub"></ul></div>
<div class="urb-zoom"><button type="button" class="round urb-exit" aria-label="Leave the model">${svgIco(['M12.5 12.5L87.5 87.5', 'M87.5 12.5L12.5 87.5'])}</button><button type="button" class="round" data-zoom="1" aria-label="Closer">${svgIco(['M50 10V90', 'M10 50H90'])}</button><button type="button" class="round" data-zoom="-1" aria-label="Further">${svgIco(['M10 50H90'])}</button><button type="button" class="round" data-turn="1" aria-label="Turn to the left">${svgIco(['M12.5 20A62.5 62.5 0 0 0 75 82.5', 'M55 62.5L75 82.5L55 97.5'])}</button><button type="button" class="round" data-turn="-1" aria-label="Turn to the right" style="transform:scaleX(-1)">${svgIco(['M12.5 20A62.5 62.5 0 0 0 75 82.5', 'M55 62.5L75 82.5L55 97.5'])}</button><button type="button" class="round urb-move" aria-pressed="false" aria-label="Move the model instead of turning it">${svgIco(['M50 5V95', 'M5 50H95', 'M36 19L50 5L64 19', 'M36 81L50 95L64 81', 'M19 36L5 50L19 64', 'M81 36L95 50L81 64'])}</button><button type="button" class="round" data-zoom="0" aria-label="The whole site">${svgIco(['M12.5 40V12.5H40', 'M60 12.5H87.5V40', 'M87.5 60V87.5H60', 'M40 87.5H12.5V60'])}</button></div>
<div class="urb-tip" hidden></div><div class="urb-tags"></div>`;
    stage.append(ui); const $ = s => ui.querySelector(s), card = $('.urb-card'), tip = $('.urb-tip'), tags = $('.urb-tags'), zoneBtns = [...ui.querySelectorAll('[data-zone]')], plan = stage.dataset.view === 'plan';
    const tagFor = (html, cls, p) => { const t = document.createElement('button'); t.type = 'button'; t.className = 'urb-tag ' + cls; t.innerHTML = html; tags.append(t); return { el: t, p } };
    const zoneTags = ZONES.map(z => { const t = tagFor(`<span>${z.name}</span>`, 'q', new T.Vector3(z.at[0], 2, -z.at[1])); t.el.dataset.hue = z.hue; t.el.addEventListener('click', () => choose({ zone: z.id })); t.el.addEventListener('pointerenter', () => hover({ zone: z.id })); t.el.addEventListener('pointerleave', () => hover(null)); return t });
    const floorTags = FLOORS13.slice(1).map((name, i) => { const t = tagFor(`<span>${name}</span>`, 'f', new T.Vector3()); t.el.addEventListener('click', () => location.href = `rent.html#floor-${FLOOR_PLAN[i + 1]}`); return t });
    // on the plan view (About page) every numbered building of the plan carries its number
    const numTags = plan ? KNOWN.map(k => { const t = tagFor(k.n === '110' ? '101-113' : k.n, 'n', new T.Vector3(k.at[0], (info[k.n] ? info[k.n].box.max.y : 8) + 1, -k.at[1])); if (info[k.n] && info[k.n].use) t.el.addEventListener('click', () => choose({ zone: info[k.n].zone.id, b: k.n })); return t }) : [];

    /* ---------- the camera: where it looks, from where, how close. Every move is flown, never cut. */
    const home = plan ? { az: 0, el: 1.36, zoom: 1.55, x: 40, z: 40, y: 0 } : { az: .5, el: .64, zoom: 1.5, x: 40, z: 45, y: 0 }, view = { ...home }; let fly = null, W = 1, H = 1, base = 640, chosen = null, hot = null, level = 0, born = 0;
    const flyTo = (goal, ms = 1150) => { let da = (goal.az ?? view.az) - view.az; da = ((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; fly = { from: { ...view }, to: { ...view, ...goal, az: view.az + da }, t0: performance.now(), ms }; dirty = true };
    const centreOf = box => [(box.min.x + box.max.x) / 2, (box.min.z + box.max.z) / 2];
    const zoneBox = z => { const b = new T.Box3(); z.poly.forEach(([x, y]) => b.expandByPoint(new T.Vector3(x, 0, -y))); return b };
    const fit = (box, pad) => clamp(Math.min(base * 2 / (Math.max(box.max.x - box.min.x, 60) * pad), base * 2 * Hv / W / (Math.max(box.max.z - box.min.z, 60) * pad * .8)), 1, 14);
    // a phone: the list of quarters (or the menu bar) covers the top of the model and the card covers its foot. The model is shown in what is left between them:
    // the picture is raised or lowered by half the difference (shift, in pixels), and a quarter is fitted to that free height (Hv), so nothing chosen hides behind a panel.
    let shift = 0, shiftTo = 0, Hv = 1;
    const inset = () => { const narrow = W <= 820, lb = $('.urb-list'), ib = narrow && !card.hidden ? card.offsetHeight : 0, it = !narrow ? 0 : chosen ? 62 : lb.offsetTop + lb.offsetHeight;
      stage.style.setProperty('--card-h', ib + 'px'); shiftTo = (ib - it) / 2; Hv = Math.max(160, H - ib - it); if (!born) shift = shiftTo; dirty = true };

    function show() {   // the list, the card and the tags say where we are
      zoneBtns.forEach(b => { b.classList.toggle('on', !!chosen && chosen.zone === b.dataset.zone); b.classList.toggle('dim', !!chosen && chosen.zone !== b.dataset.zone) });
      const z = chosen && zones[chosen.zone], b = chosen && chosen.b && info[chosen.b]; card.hidden = !chosen; stage.classList.toggle('in-zone', !!chosen); stage.classList.toggle('in-building', !!b); stage.classList.toggle('in-13', !!b && b.n === '13');
      if (!chosen) return inset(); card.dataset.hue = z.hue; $('.urb-back span').textContent = b ? z.name : 'The whole site';
      $('.urb-kick').textContent = b ? z.name : 'Quarter'; card.querySelector('h3').textContent = b ? (b.label || 'Building ' + b.n) : z.name; $('.urb-text').textContent = b ? (b.use || '') : z.text;
      const sub = $('.urb-sub'); sub.innerHTML = '';
      if (b && b.n === '13') FLOORS13.slice().reverse().forEach((f, i) => { const k = FLOORS13.length - 1 - i; sub.insertAdjacentHTML('beforeend', `<li><a href="rent.html#floor-${FLOOR_PLAN[k]}"><i>${k === 0 ? '-1' : k === 7 ? 'R' : k - 1}</i>${f}</a></li>`) });
      else if (!b) Object.values(info).filter(x => x.zone === z && x.use).forEach(x => { const li = document.createElement('li'), a = document.createElement('button'); a.type = 'button'; a.innerHTML = `<i>${x.n === 'tower' || x.n === '110' ? '' : x.n}</i>${x.label || 'Building ' + x.n}`; a.addEventListener('click', () => choose({ zone: z.id, b: x.n })); li.append(a); sub.append(li) });
      inset();
    }
    function choose(c) {   // nothing: the whole site. A quarter. A building in its quarter.
      chosen = c; hot = null; for (const e of edges) e.material.opacity = c && c.b && e.userData.b === c.b ? .9 : .34; for (const k in zones) zones[k].to = c && k !== c.zone ? 1 : 0; level = !c ? 0 : c.b ? 2 : 1; show();
      if (!c) flyTo(home); else if (!c.b) { const bx = zoneBox(zones[c.zone]), [x, zz] = centreOf(bx); flyTo({ x, z: zz, y: 0, zoom: fit(bx, 1.5), el: .62, az: plan ? .5 : view.az }) }
      else { const g = info[c.b], [x, zz] = centreOf(g.box); flyTo({ x: x + (c.b === '13' ? -22 : 0), z: zz, zoom: fit(g.box, c.b === '13' ? 2.7 : c.b === 'tower' ? 2.1 : 2.2), el: c.b === 'tower' ? .2 : .5, y: c.b === 'tower' ? 37 * UP : 0, az: c.b === 'tower' ? Math.PI - .62 : c.b === '13' ? .62 : plan ? .5 : view.az }, c.b === 'tower' ? 1700 : 1300) }
      open13 = c && c.b === '13' ? 1 : 0; dirty = true; if (c && matchMedia('(hover:none)').matches) setFree(true);   // on a phone, choosing a quarter (on the model, on its name or in the list) enters the model
    }
    function hover(h) { const key = h && (h.b || h.zone), was = hot && (hot.b || hot.zone); if (key === was) return; hot = h; canvas.style.cursor = h ? 'pointer' : '';
      for (const e of edges) e.material.opacity = (h && h.b && e.userData.b === h.b) || (chosen && chosen.b && e.userData.b === chosen.b) ? .95 : .34;
      if (!chosen) for (const k in zones) zones[k].to = h && k !== h.zone ? .5 : 0;
      zoneBtns.forEach(b => b.classList.toggle('hot', !!h && b.dataset.zone === h.zone)); dirty = true }
    zoneBtns.forEach(b => { b.addEventListener('click', () => choose(chosen && chosen.zone === b.dataset.zone && !chosen.b ? null : { zone: b.dataset.zone })); b.addEventListener('pointerenter', () => hover({ zone: b.dataset.zone })); b.addEventListener('pointerleave', () => hover(null)) });
    $('.urb-back').addEventListener('click', () => choose(chosen && chosen.b ? { zone: chosen.zone } : null));
    ui.querySelectorAll('[data-turn]').forEach(b => b.addEventListener('click', () => flyTo({ az: view.az + +b.dataset.turn * Math.PI / 4 }, 650)));
    ui.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => { const d = +b.dataset.zoom; d ? flyTo({ zoom: clamp(view.zoom * (d > 0 ? 1.6 : 1 / 1.6), 1, 14) }, 500) : choose(null) }));

    /* ---------- the hand on the model: drag turns it, a second finger or ctrl + wheel zooms, a double click comes closer, a click chooses */
    const ray = new T.Raycaster(), mouse = new T.Vector2(), ptrs = new Map(); let drag = null, pinch = null, swayAt = performance.now(), free = false, slide = false;
    const EL0 = .1, EL1 = 1.5, sinEl = () => Math.max(.35, Math.sin(view.el));   // from almost level with the ground to straight above; the slide of the ground stays calm when the view is low
    // on a phone a finger across the model turns it and a finger up or down still scrolls the page; a tap enters the model: then the fingers move it freely, and a cross leaves it
    const setFree = on => { free = on; stage.classList.toggle('free', on) };
    $('.urb-x').addEventListener('click', () => { choose(null); setFree(false) }); $('.urb-exit').addEventListener('click', () => { choose(null); setFree(false) });
    $('.urb-move').addEventListener('click', e => { slide = !slide; e.currentTarget.setAttribute('aria-pressed', slide) });
    const under = e => { const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, cam); const hit = ray.intersectObjects(picks, false)[0]; return hit ? { zone: hit.object.userData.zone, b: hit.object.userData.b, point: hit.point } : null };
    const told = h => h && h.b && info[h.b] && info[h.b].use;
    canvas.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, e); canvas.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, zoom: view.zoom, ang: Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX), az: view.az, mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2, vx: view.x, vz: view.z }; drag = null } else drag = { x: e.clientX, y: e.clientY, az: view.az, el: view.el, vx: view.x, vz: view.z, moved: 0, turn: slide === (e.shiftKey || e.altKey || e.button === 2 || e.button === 1), touch: e.pointerType === 'touch' }; fly = null });
    canvas.addEventListener('contextmenu', e => e.preventDefault()); canvas.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault() }, { passive: false }); canvas.addEventListener('gesturestart', e => e.preventDefault());
    canvas.addEventListener('pointermove', e => { if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, e);
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; view.zoom = clamp(pinch.zoom * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d, ZMIN, 14);
        let da = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) - pinch.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); view.az = pinch.az + (Math.abs(da) > .16 ? da - Math.sign(da) * .16 : 0);   // a clear twist of the two fingers turns the model
        const u = 2 * base / (view.zoom * W), az = view.az, f = u / sinEl(), dx = (a.clientX + b.clientX) / 2 - pinch.mx, dy = (a.clientY + b.clientY) / 2 - pinch.my;
        view.x = clamp(pinch.vx - dx * u * Math.cos(az) - dy * f * Math.sin(az), -R, R); view.z = clamp(pinch.vz + dx * u * Math.sin(az) - dy * f * Math.cos(az), -R, R); fly = null; dirty = true; tip.hidden = true; return }
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy)); if (drag.moved > 4) { if (drag.turn) { view.az = drag.az - dx * .0058; if (!drag.touch || free) view.el = clamp(drag.el + dy * .0042, EL0, EL1) }
          else { const u = 2 * base / (view.zoom * W), a = view.az, f = u / sinEl(); view.x = clamp(drag.vx - dx * u * Math.cos(a) - dy * f * Math.sin(a), -R, R); view.z = clamp(drag.vz + dx * u * Math.sin(a) - dy * f * Math.cos(a), -R, R) }
          canvas.style.cursor = 'grabbing'; dirty = true; touched = performance.now(); tip.hidden = true } return }
      if (e.pointerType !== 'mouse') return; const h = under(e); hover(h && h.zone ? (told(h) ? { zone: h.zone, b: h.b } : { zone: h.zone }) : null);
      const g = told(h) && info[h.b]; tip.hidden = !g; if (g) { tip.innerHTML = `<b>${g.label || 'Building ' + g.n}</b>${g.use ? `<span>${g.use}</span>` : ''}`; const r = stage.getBoundingClientRect(); tip.style.transform = `translate(${Math.min(e.clientX - r.left + 16, r.width - 250)}px,${e.clientY - r.top + 18}px)` } });
    const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!drag) return; const d = drag; drag = null; swayAt = performance.now(); dirty = true; if (d.moved > 4) return; if (e.pointerType === 'touch') setFree(true); const h = under(e); if (!h || !h.zone) return choose(null); choose(told(h) ? { zone: h.zone, b: h.b } : chosen && chosen.zone === h.zone && !chosen.b ? null : { zone: h.zone }) };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = pinch = null }); canvas.addEventListener('pointerleave', () => { if (!drag) { hover(null); tip.hidden = true } });
    // the wheel zooms, on the point under the pointer. A wheel that was already scrolling the page goes on scrolling it; so does a zoom out when the whole site is in view.
    let lastScroll = 0; addEventListener('scroll', () => lastScroll = performance.now(), { passive: true }); const ZMIN = home.zoom * .7;
    canvas.addEventListener('wheel', e => { const pinchy = e.ctrlKey || e.metaKey; if (!pinchy && (performance.now() - lastScroll < 420 || (e.deltaY > 0 && view.zoom <= ZMIN + .001))) return; e.preventDefault();
      const r = canvas.getBoundingClientRect(), px = e.clientX - r.left - r.width / 2, py = e.clientY - r.top - r.height / 2 + shift, a = view.az, s = sinEl(), u0 = 2 * base / (view.zoom * W);
      const z1 = clamp(view.zoom * Math.exp(-e.deltaY * (pinchy ? .012 : .0024)), ZMIN, 14), u1 = 2 * base / (z1 * W), k = u0 - u1;   // the point under the pointer stays under it
      view.x = clamp(view.x + px * k * Math.cos(a) + py * k / s * Math.sin(a), -R, R); view.z = clamp(view.z - px * k * Math.sin(a) + py * k / s * Math.cos(a), -R, R); view.zoom = z1; fly = null; dirty = true; touched = performance.now() }, { passive: false });
    // reaching this part of the page, the model takes the whole screen: the page settles on it
    let settle = 0; addEventListener('scroll', () => { clearTimeout(settle); settle = setTimeout(() => { const r = stage.getBoundingClientRect(); if (!drag && Math.abs(r.top) > 2 && Math.abs(r.top) < innerHeight * .3) scrollTo({ top: scrollY + r.top, behavior: 'smooth' }) }, 170) }, { passive: true });
    canvas.addEventListener('dblclick', e => { const h = under(e); if (h) flyTo({ x: h.point.x, z: h.point.z, zoom: clamp(view.zoom * 2, 1, 14) }, 700) });
    addEventListener('keydown', e => { if (e.key === 'Escape' && chosen) choose(chosen.b ? { zone: chosen.zone } : null); else if (e.key === 'Escape') setFree(false) });

    /* ---------- the light of the hour: the sun stands where it stands in Wittenberge now (east in the morning, south at noon, west in the evening);
       in the evening it is low and warm and the windows light up */
    function daylight(at) { const now = new Date(), p = {}; for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now)) p[x.type] = +x.value; const hour = typeof at === 'number' ? at : (p.hour % 24) + p.minute / 60;
      const day = clamp(Math.sin(Math.PI * (hour - 6) / 13), 0, 1), evening = 1 - clamp(day * 2.4, 0, 1), el = rad(lerp(46, 62, day))   /* never a low sun: long pale shadows across the roads read as faults */, bearing = rad(95 + (clamp(hour, 6, 19) - 6) / 13 * 170);   // compass bearing of the sun
      sun.position.set(Math.sin(bearing) * Math.cos(el) * 1200, Math.sin(el) * 1200, -Math.cos(bearing) * Math.cos(el) * 1200); sun.color.copy(mix('#ffffff', HUE.brown[3], evening)); sun.intensity = lerp(.84, .66, evening); fill.position.set(-sun.position.x, 520, -sun.position.z); fill.color.copy(mix('#ffffff', HUE.turquoise[3], .5)); fill.intensity = .22;
      amb.intensity = 1.04 - sun.intensity * Math.sin(el) - fill.intensity * .5;   // the ground keeps its true colour at every hour; only the fronts and the shadows change
      for (const m of glass) m.emissiveIntensity = evening * .8; api.evening = evening; shadowDirty = dirty = true }

    /* ---------- the frame: the arrival, the flights, the fading of the quarters not chosen, building 13 opening, the water, the tags */
    const calm = matchMedia('(prefers-reduced-motion:reduce)').matches; let lastDraw = 0, shadowTick = 0, keepShadow = false, visible = false, openNow = 0, lastT = 0, skip = false, towerRise = -1, townRise = -1, lastSec = -1;
    const order = ['harbour', 'park', 'industrial', 'creative', 'culture', 'factory'];
    /* ---------- a model for every machine. The model watches how long its own pictures take while it moves. Under 25 a second it lightens itself, once and for good:
       grade 1: no shadows, a coarser picture while moving. Grade 2 (a machine with no graphics card, about 3 pictures a second): no trees, a coarse picture, and nothing moves by itself any more
       (no water, no sway), so the page around the model stays free. A machine known to draw without a graphics card starts at grade 2. */
    let grade = 0, still = false, slowN = 0, slowAvg = 0, drewLast = false;
    const soft = (() => { try { const g = renderer.getContext(), e = g.getExtension('WEBGL_debug_renderer_info'); return /swiftshader|llvmpipe|software|basic render/i.test(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '') } catch (x) { return false } })();
    const lighten = g => { if (g <= grade) return; grade = g; slowN = slowAvg = 0; DPR_MOVE = Math.min(DPR_MOVE, g > 1 ? .5 : .8); DPR_REST = Math.min(DPR_REST, g > 1 ? .75 : 1);
      if (renderer.shadowMap.enabled) { renderer.shadowMap.enabled = false; sun.castShadow = false; scene.traverse(o => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true }) }
      if (g > 1) { still = true; wood.visible = false } dprNow = -1; dirty = true; stage.dataset.grade = g };
    function size() { W = stage.clientWidth; H = stage.clientHeight; if (!W || !H) return; renderer.setSize(W, H, false); base = W / H > 1.25 ? 640 : 420; inset() }
    function frame(now) { if (!visible) return; requestAnimationFrame(frame); const raw = now - lastT, dt = Math.min(50, raw); lastT = now; let moving = false;
      if (!born) born = now; const age = (now - born) / 1000;   // the arrival: the town, then quarter after quarter, the tower last
      const wr = calm ? 1 : out(clamp(age / .9, 0, 1)); if (wr !== townRise) { townRise = wr; town.scale.y = wood.scale.y = Math.max(.0001, wr); moving = shadowDirty = true }
      order.forEach((id, i) => { const z = zones[id], r = calm ? 1 : out(clamp((age - .5 - i * .2) / .9, 0, 1)); if (r !== z.rise) { z.rise = r; z.group.scale.y = Math.max(.0001, r); moving = shadowDirty = true } });
      const tr = calm ? 1 : out(clamp((age - 2) / 1.1, 0, 1)); if (tr !== towerRise) { towerRise = tr; tower.scale.y = Math.max(.0001, tr); moving = shadowDirty = true }
      if (Math.abs(shiftTo - shift) > .4) { shift += (shiftTo - shift) * Math.min(1, dt * .008); moving = true }
      if (fly) { const t = clamp((now - fly.t0) / fly.ms, 0, 1), k = ease(t); for (const key in view) view[key] = lerp(fly.from[key], fly.to[key], k); moving = true; if (t === 1) fly = null }
      for (const k in zones) { const z = zones[k]; if (Math.abs(z.to - z.k) > .003) { z.k += (z.to - z.k) * Math.min(1, dt * .009); moving = true; for (const m of z.mats) { m.color.copy(m.userData.base).lerp(m.userData.pale, z.k * .9); if (m.userData.wash) m.emissive.copy(m.userData.pale).multiplyScalar(z.k * .6) } } }
      if (Math.abs(open13 - openNow) > .002) { openNow += (open13 - openNow) * Math.min(1, dt * .006); moving = shadowDirty = true; floors.forEach((g, i) => g.position.y = openNow * i * 7.5) }
      const sec = Math.floor(Date.now() / 1000); if (sec !== lastSec && level === 2) { lastSec = sec; drawFace() }   // near the tower its thin hand ticks
      const idle = !chosen && !drag && !fly && !calm && !plan && !still, sway = idle ? Math.sin((now - swayAt) / 5200) * .05 : 0; if (!lite && !still && now - lastDraw > 50 && !document.hidden) moving = true;   // the water: 20 pictures a second
      for (const f of api.hooks) f(now);
      const dpr = fly || drag || pinch || now - touched < 260 || age < 3.6 ? DPR_MOVE : DPR_REST; if (dpr !== dprNow) { dprNow = dpr; renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); dirty = true }   // moving: a light picture; still: one drawn at the true density of the screen
      if (!moving && !dirty) { drewLast = false; return }
      if (drewLast && grade < 2 && age > 4 && raw < 1500 && !document.hidden) { slowAvg += (raw - slowAvg) * (slowN < 6 ? 1 / (slowN + 1) : .2); if (++slowN >= 8 && slowAvg > 40) lighten(slowAvg > 110 ? 2 : grade + 1) }   // two pictures in a row: the time between them is the time one picture takes
      drewLast = true; dirty = false; lastDraw = now; if (shadowDirty && age < 3.4 && (shadowTick = (shadowTick + 1) % 5)) shadowDirty = false, keepShadow = true; else if (keepShadow && age >= 3.4) shadowDirty = true, keepShadow = false;
      const a = view.az + sway, D = 2200; const lift = shift * 2 * base / (W * view.zoom); cam.left = -base; cam.right = base; cam.top = base * H / W - lift; cam.bottom = -base * H / W - lift; cam.zoom = view.zoom; cam.updateProjectionMatrix();
      cam.position.set(view.x + Math.sin(a) * Math.cos(view.el) * D, view.y + Math.sin(view.el) * D, view.z + Math.cos(a) * Math.cos(view.el) * D); cam.lookAt(view.x, view.y, view.z); cam.updateMatrixWorld();
      if (shadowDirty) { renderer.shadowMap.needsUpdate = true; shadowDirty = false } renderer.render(scene, cam);
      const put = (t, v) => { if (t.lift) v.y = t.lift(); v.project(cam); t.el.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(1)}px,${((1 - v.y) / 2 * H).toFixed(1)}px)` };
      for (const t of zoneTags) { put(t, V.copy(t.p)); t.el.style.visibility = view.zoom > 3.4 ? 'hidden' : '' } for (const t of numTags) put(t, V.copy(t.p));
      const fh = b13.max.y / 6; floorTags.forEach((t, i) => { put(t, V.set(b13.max.x + 2, fh * (i + .5) + openNow * i * 7.5, b13.max.z)); t.el.style.opacity = clamp(openNow * 1.6 - .3, 0, 1) }) }
    new ResizeObserver(size).observe(stage); new ResizeObserver(inset).observe(card); size(); daylight(); drawFace(); setInterval(() => { drawFace(); if (!stage.dataset.hour) daylight() }, 30000); show();
    new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (!visible && free) setFree(false); if (visible && !was) { dirty = true; lastT = performance.now(); requestAnimationFrame(frame) } }, { rootMargin: '0px 0px -10% 0px' }).observe(stage);
    // the detail modules: railway and train, roof walls and gates, kerbs and lamps, people, cars and boats
    Object.assign(api, { T, scene, MAP, R, UP, HUE, zones, zoneAt, info, town, mix, mat, pairs, inside, area, centroid, greens, waters, wood, flat, lay, shapeOf, b13, roof13: floors[floors.length - 1], lite, mark: () => { dirty = shadowDirty = true } });
    api.redraw = () => { dirty = true; shadowDirty = true };   // a module that finishes late (the trees, read from a file) asks for a new picture
    for (const f of window.VERITAS_DETAIL || []) { try { f(api) } catch (e) { console.error(e) } }
    shadowDirty = true; if (soft) lighten(2); stage.urbanotop = { choose, flyTo, view, daylight, api, quality: () => grade, lighten };   // for the checks
  }
  const go = () => { if (!T || !MAP) return; document.querySelectorAll('[data-urbanotop]').forEach(s => { const io = new IntersectionObserver(es => { if (!es.some(e => e.isIntersecting)) return; io.disconnect(); const t0 = performance.now(); try { mount(s) } catch (e) { console.error(e) } s.dataset.built = Math.round(performance.now() - t0) }, { rootMargin: '130% 0px' }); io.observe(s) }) };   // the model is built only when its place comes near the screen
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
})();

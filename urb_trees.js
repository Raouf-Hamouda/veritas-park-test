/* VERITAS, the 3D model: the trees. Fifth version, at his ask of 23 Nov ("get free glb trees, the ones here are really bad"):
   real tree models, free (CC0) by Quaternius via poly.pizza: six broad leafy trees and six pines, their leaves a texture with holes.
   Converted once by sources/trees_dl/convert.py into img/trees/trees.bin (each tree upright, 1 high, its foot at 0).
   Where they stand is unchanged: the single trees and rows of the map, the green of the map, none on a building, a street, a track or the water.
   Kinds: broad (the leafy ones), column (the same, made narrow and tall like poplars), fir (the pines), bush (a leafy one, low and wide).
   Always the same trees: the dice are loaded with a fixed number. */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, MAP, pairs, inside, area, HUE, mix, zones, R } = api;
  let seed = 1903; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(rnd() * a.length)];
  // the shapes each kind may take (index in trees.json); a phone takes only the lightest
  const LITE = api.lite;
  const KINDS = { broad: { crowns: LITE ? [0, 2] : [0, 1, 2, 3], h: [9, 16] }, column: { crowns: LITE ? [0] : [0, 2], h: [15, 22], narrow: .62 }, fir: { crowns: [4], h: [10, 16] }, bush: { crowns: [5], h: [2.2, 4.2] } };
  // the greens of leaves, mixed from the two greens of the book; the conifers are the darkest
  const LEAF = [mix(HUE.green[1], HUE.green[2], .3), mix(HUE.green[0], HUE.green[2], .42), mix(HUE.soft[1], HUE.soft[2], .25), mix(HUE.green[1], HUE.soft[1], .5), mix(HUE.green[0], HUE.soft[2], .5)], DARK = [mix(HUE.green[2], HUE.green[1], .32), mix(HUE.green[2], HUE.turquoise[2], .3)];

  // where no tree can stand
  const builds = api.boxed(MAP.buildings.map(b => pairs(b.p))), waters = api.boxed(api.waters), lines = [...MAP.roads.map(r => ({ l: pairs(r.p), w: (api.WIDTH[r.k] || 3) / 2 + 2.5 })), ...MAP.rails.map(r => ({ l: pairs(r), w: 4.5 }))].map(o => { const xs = o.l.map(q => q[0]), ys = o.l.map(q => q[1]); return { ...o, x0: Math.min(...xs) - o.w, x1: Math.max(...xs) + o.w, y0: Math.min(...ys) - o.w, y1: Math.max(...ys) + o.w } });
  const planted = [], free = (x, y, gap) => Math.hypot(x, y) < R - 14 && Math.hypot(x, y) > 16 && !api.hit(builds, x, y, 3) && !api.hit(waters, x, y, 2.5) && !lines.some(o => x > o.x0 && x < o.x1 && y > o.y0 && y < o.y1 && api.away(o.l, x, y) < o.w) && !planted.some(q => Math.abs(q[0] - x) < gap && Math.abs(q[1] - y) < gap && Math.hypot(q[0] - x, q[1] - y) < gap);
  const bags = {};   // kind and shape -> the trees of that shape
  const plant = (kind, x, y, tall = 1, shape) => { const K = KINDS[kind], v = shape ?? Math.floor(rnd() * K.crowns.length), H = (K.h[0] + rnd() * (K.h[1] - K.h[0])) * tall, wide = H * (.9 + rnd() * .2) * (K.narrow || K.wide || 1);
    const tint = new T.Color(1, 1, 1).lerp(pick(kind === 'fir' ? DARK : LEAF), .22).multiplyScalar(1.08 + rnd() * .22); (bags[kind + v] = bags[kind + v] || { K, v, items: [] }).items.push({ x, y: 0, z: -y, sx: wide, sy: H, sz: wide * (.9 + rnd() * .2), ry: rnd() * 6.28, color: tint }); planted.push([x, y]) };
  const any = () => { const k = rnd(); return k < .13 ? 'fir' : k < .3 ? 'column' : 'broad' };
  for (const [x, y] of pairs(MAP.trees)) if (free(x, y, 3)) plant('broad', x, y, 1.1);
  for (const row of MAP.rows) { const shape = Math.floor(rnd() * 3); for (const line of api.clip(pairs(row))) api.along(line, 9.5, (x, y) => { if (free(x, y, 4)) plant('broad', x, y, .82 + rnd() * .1, shape) }, 2) }
  const scatter = (p, per1000, kind, tall = 1, gap = 6.5) => { const xs = p.map(q => q[0]), ys = p.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), want = Math.min(220, Math.abs(area(p)) / 1000 * per1000) * (api.lite ? .35 : 1); let made = 0, tries = 0;
    while (made < want && tries++ < want * 28) { const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); if (!inside(x, y, p) || !free(x, y, gap)) continue; plant(kind || any(), x, y, tall); made++ } };
  for (const g of api.greens) { if (g.k === 'scrub') { scatter(g.p, 2.4, 'bush', 1, 5); scatter(g.p, 1, null, .8) } else if (g.k === 'allotments') scatter(g.p, 1.2, 'bush', .8, 5); else scatter(g.p, { wood: 5.2, park: 1.8, meadow: .25, grass: .5 }[g.k] || 0, null, g.k === 'wood' ? 1.1 : 1, g.k === 'wood' ? 5.5 : 7.5) }
  for (const [id, n] of [['park', 2.1], ['harbour', 1.2], ['creative', .55], ['industrial', .22], ['culture', .32], ['factory', .2]]) scatter(zones[id].poly, n, null, 1, 8);
  for (const [id, n] of [['park', .6], ['harbour', .45], ['creative', .25]]) scatter(zones[id].poly, n, 'bush', 1, 5.5);


  // the trees themselves: read the file once, then one instanced mesh per shape (leaves and wood are one shape, their colours on its corners)
  const dir = 'img/trees/';
  Promise.all([fetch(dir + 'trees.json?v=2').then(r => r.json()), fetch(dir + 'trees.bin?v=2').then(r => r.arrayBuffer())]).then(([meta, buf]) => {
    const shape = t => { const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(Float32Array.from(new Int16Array(buf, t.p, t.n * 3), v => v / 16000), 3));
      g.setAttribute('normal', new T.BufferAttribute(Float32Array.from(new Int8Array(buf, t.nr, t.n * 3), v => v / 127), 3));
      g.setAttribute('color', new T.BufferAttribute(Float32Array.from(new Uint8Array(buf, t.c, t.n * 3), v => v / 255), 3));
      g.setIndex(new T.BufferAttribute(new Uint16Array(buf, t.ix, t.i), 1)); g.computeBoundingSphere(); return g };
    const shapes = meta.trees.map(shape), mat = new T.MeshLambertMaterial({ vertexColors: true });
    let tris = 0, count = 0;
    for (const key in bags) { const { K, v, items } = bags[key], g = shapes[K.crowns[v]];
      api.instances(g, mat, items, api.wood, !LITE); count += items.length; tris += items.length * g.index.count / 3 }
    window.__trees = { count, tris: Math.round(tris) }; api.redraw && api.redraw();
  });
});

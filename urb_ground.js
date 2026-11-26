/* VERITAS, the 3D model: the streets and paths, drawn the way a map draws them so that every junction and every end is clean.
   Each street is laid twice: first a wider pale band (its kerbs and pavements), then its asphalt on top. Where two streets meet, the asphalt
   of one covers the kerb of the other, so no kerb crosses a junction, and round ends close every street. Paths are pale gravel.
   Bridges (as the map marks them) carry parapets. The main streets get a dashed centre line and lamps that light up in the evening. No cars. */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, MAP, town, pairs, HUE, mix } = api, waters = api.boxed(api.waters);
  const colour = { casing: '#F1EEE8', fill: '#C2BFBA', path: '#E9E3D6' }, seg = { casing: [], fill: [], path: [] }, dot = { casing: [], fill: [], path: [] }, Y = { casing: .3, path: .33, fill: .36 };
  const band = (kind, line, w) => { api.pieces(line, (x, y, len, a) => seg[kind].push({ x, y: Y[kind], z: -y, sx: len, sz: w, ry: a })); for (const [x, y] of line) dot[kind].push({ x, y: Y[kind], z: -y, sx: w, sz: w }) };
  const parapets = [], dashes = [], poles = [], arms = [], heads = [], tube = new T.CylinderGeometry(.5, .5, 1, 8);
  for (const r of MAP.roads) {
    const w = api.WIDTH[r.k] || 3, street = ['tertiary', 'unclassified', 'residential', 'living_street', 'service'].includes(r.k), main = ['tertiary', 'unclassified', 'residential'].includes(r.k);
    for (const line of api.clip(pairs(r.p))) {
      if (!street) { band('path', line, w); continue }
      band('casing', line, w + (r.b ? 2.6 : 1.5)); band('fill', line, w);
      if (r.b) api.pieces(line, (x, y, len, a) => { for (const side of [-1, 1]) parapets.push({ x: x - Math.sin(a) * side * (w / 2 + .95), y: .95, z: -(y + Math.cos(a) * side * (w / 2 + .95)), sx: len + .4, sy: 1.25, sz: .32, ry: a }) });
      if (r.k === 'tertiary') api.along(line, 9, (x, y, a) => dashes.push({ x, y: .39, z: -y, sx: 3, sz: .18, ry: a }));
      if (main && !r.b) api.along(line, 40, (x, y, a) => { if (api.hit(waters, x, y, 6)) return;
        const o = w / 2 + 1.1, px = x - Math.sin(a) * o, py = y + Math.cos(a) * o, hx = x - Math.sin(a) * (o - 1.3), hy = y + Math.cos(a) * (o - 1.3);
        poles.push({ x: px, y: 3.7, z: -py, sx: .2, sy: 7.4, sz: .2 }); arms.push({ x: (px + hx) / 2, y: 7.36, z: -(py + hy) / 2, sx: .1, sy: .1, sz: 1.7, ry: a }); heads.push({ x: hx, y: 7.25, z: -hy, sx: .42, sy: .14, sz: .9, ry: a }) });
    }
  }
  // the car park of the plan ("Parkplätze", north of the creative quarter): its asphalt and its white bays
  const lot = { x0: -122, x1: 42, y0: 148, y1: 190 }, bays = [];
  seg.fill.push({ x: (lot.x0 + lot.x1) / 2, y: Y.fill, z: -(lot.y0 + lot.y1) / 2, sx: lot.x1 - lot.x0 + 6, sz: lot.y1 - lot.y0 + 4 }); seg.casing.push({ x: (lot.x0 + lot.x1) / 2, y: Y.casing, z: -(lot.y0 + lot.y1) / 2, sx: lot.x1 - lot.x0 + 7.5, sz: lot.y1 - lot.y0 + 5.5 });
  for (const y of [lot.y0 + 3.2, lot.y0 + 13.4, lot.y0 + 28.6, lot.y0 + 38.8]) for (let x = lot.x0 + 2; x < lot.x1 - 2; x += 2.75) bays.push({ x, y: .39, z: -y, sx: .12, sz: 5 });

  for (const kind of ['casing', 'path', 'fill']) { const m = new T.MeshLambertMaterial({ color: colour[kind] }); api.instances(api.quad, m, seg[kind], town, false); api.instances(api.disc, m, dot[kind], town, false) }
  const white = new T.MeshLambertMaterial({ color: '#ffffff' }), metal = new T.MeshLambertMaterial({ color: '#9A958F' }), lamp = new T.MeshLambertMaterial({ color: '#F2EFE9', emissive: mix(HUE.ocher[0], HUE.brown[3], .4), emissiveIntensity: 0 });
  api.instances(api.quad, white, dashes, town, false); api.instances(api.quad, white, bays, town, false); api.instances(api.box, new T.MeshLambertMaterial({ color: '#E6E2DA' }), parapets, town);
  api.instances(tube, metal, poles, town, false); api.instances(api.box, metal, arms, town, false); api.instances(api.box, lamp, heads, town, false);
  api.hooks.push(() => { lamp.emissiveIntensity = api.evening * .9 });
});

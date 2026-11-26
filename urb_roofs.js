/* VERITAS, the 3D model: what the buildings of the site carry besides their windows.
   A low wall runs round every flat roof. Long fronts get their gates, one about every 26 m, each under a small canopy.
   Large roofs carry the heads of their stairs and a few vents. Everything takes the colours of its quarter and fades with it. */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, UP, area, inside } = api, tube = new T.CylinderGeometry(.5, .5, 1, 10), bags = {};
  for (const s of api.sites) {
    const z = s.zone, bag = bags[z.id] = bags[z.id] || { zone: z, wall: [], gate: [], canopy: [], head: [], vent: [] };
    const p = s.p, ccw = area(p) > 0, hotel = s.k && s.k.n === '13';
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      if (len < 1.5 || (s.isCut && s.isCut(a, b))) continue;
      const ux = dx / len, uy = dy / len, ox = ccw ? uy : -uy, oy = ccw ? -ux : ux, ang = Math.atan2(dy, dx), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (!hotel) bag.wall.push({ x: mx - ox * .25, y: s.h + .45 * UP, z: -(my - oy * .25), sx: len + .3, sy: .9 * UP, sz: .5, ry: ang });   // the low wall of the roof
      if (len < 17) continue;
      const n = Math.max(1, Math.round(len / 26));
      for (let k = 0; k < n; k++) {
        const t = len * (k + .5) / n, gx = a[0] + ux * t, gy = a[1] + uy * t;
        bag.gate.push({ x: gx + ox * .16, y: 1.9 * UP, z: -(gy + oy * .16), sx: 3.4, sy: 3.8 * UP, sz: .2, ry: ang });
        bag.canopy.push({ x: gx + ox * .8, y: 4.15 * UP, z: -(gy + oy * .8), sx: 4.8, sy: .28, sz: 1.5, ry: ang });
      }
    }
    if (Math.abs(area(p)) < 1300 || hotel) continue;
    const xs = p.map(q => q[0]), ys = p.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), wide = x1 - x0 > y1 - y0;
    for (const f of [.2, .8]) {   // the heads of the stairs, towards both ends of the roof
      const x = wide ? x0 + (x1 - x0) * f : (x0 + x1) / 2, y = wide ? (y0 + y1) / 2 : y0 + (y1 - y0) * f;
      if (inside(x, y, p) && inside(x + 3, y + 3, p) && inside(x - 3, y - 3, p)) bag.head.push({ x, y: s.h + 1.5 * UP, z: -y, sx: wide ? 5 : 3.6, sy: 3 * UP, sz: wide ? 3.6 : 5 });
    }
    for (let x = x0 + 15.5; x < x1 - 8; x += 30) for (let y = y0 + 14.5; y < y1 - 8; y += 26) if (inside(x, y, p) && inside(x + 2, y + 2, p)) bag.vent.push({ x, y: s.h + .7, z: -y, sx: 1.3, sy: 1.4, sz: 1.3 });
  }
  for (const id in bags) {
    const { zone, wall, gate, canopy, head, vent } = bags[id];
    api.instances(api.box, zone.trim, wall, zone.group, false); api.instances(api.box, zone.deep, gate, zone.group, false); api.instances(api.box, zone.trim, canopy, zone.group, false);
    api.instances(api.box, zone.plain, head, zone.group); api.instances(tube, zone.trim, vent, zone.group);
  }
});

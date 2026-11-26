/* VERITAS, the 3D model: the small tools the detail modules share. Loaded before the other urb_*.js files and before urbanotop.js.
   Each detail module is a function pushed in window.VERITAS_DETAIL; the model calls them once it is built and hands them `api`
   (the scene, the map data, the quarters with their materials, the buildings of the site, a list of things to do at every frame).
   Coordinates: the map is in metres round the clock tower, x to the east, y to the north. In the model that is (x, height, -y). */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, inside } = api, M = new T.Matrix4(), P = new T.Vector3(), Q = new T.Quaternion(), S = new T.Vector3(), E = new T.Euler();
  api.box = new T.BoxGeometry(1, 1, 1);
  api.quad = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);        // a square of 1 lying on the ground
  api.disc = new T.CircleGeometry(.5, 20).rotateX(-Math.PI / 2);     // a round of 1 across lying on the ground
  api.onPlate = (x, y, margin = 8) => Math.hypot(x, y) < api.R - margin;
  // the stretches of a line that lie on the round plate
  api.clip = line => {
    const out = []; let run = [];
    for (const p of line) { if (api.onPlate(p[0], p[1], 6)) run.push(p); else { if (run.length > 1) out.push(run); run = [] } }
    if (run.length > 1) out.push(run);
    return out;
  };
  api.length = line => { let d = 0; for (let i = 1; i < line.length; i++) d += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]); return d };
  // the point at a distance d along a line, and the direction of the line there
  api.pointAt = (line, d) => {
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1], [bx, by] = line[i], len = Math.hypot(bx - ax, by - ay);
      if (d <= len || i === line.length - 1) { const t = len ? Math.max(0, Math.min(1, d / len)) : 0; return [ax + (bx - ax) * t, ay + (by - ay) * t, Math.atan2(by - ay, bx - ax)] }
      d -= len;
    }
    return [line[0][0], line[0][1], 0];
  };
  api.along = (line, step, fn, start = step / 2) => { const L = api.length(line); for (let d = start; d < L; d += step) fn(...api.pointAt(line, d), d) };
  // every straight piece of a line: its middle, its length, its direction
  api.pieces = (line, fn) => { for (let i = 1; i < line.length; i++) { const [ax, ay] = line[i - 1], [bx, by] = line[i], len = Math.hypot(bx - ax, by - ay); if (len > .2) fn((ax + bx) / 2, (ay + by) / 2, len, Math.atan2(by - ay, bx - ax)) } };
  // how far a point is from a line
  api.away = (line, x, y) => { let best = 1e9; for (let i = 1; i < line.length; i++) { const [ax, ay] = line[i - 1], [bx, by] = line[i], L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1, t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2)); best = Math.min(best, Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay))) } return best };
  // outlines kept with the box that holds them, so that "is this point inside one of them" is quick
  api.boxed = polys => polys.map(p => { const xs = p.map(q => q[0]), ys = p.map(q => q[1]); return { p, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } });
  api.hit = (boxed, x, y, m = 0) => boxed.some(b => x > b.x0 - m && x < b.x1 + m && y > b.y0 - m && y < b.y1 + m && (m ? api.away([...b.p, b.p[0]], x, y) < m || inside(x, y, b.p) : inside(x, y, b.p)));
  // many copies of one shape, drawn in one go. An item: where it stands (x, y up, z), its size, its turn round the upright.
  api.put = (mesh, i, it) => { M.compose(P.set(it.x, it.y, it.z), Q.setFromEuler(E.set(0, it.ry || 0, 0)), S.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1)); mesh.setMatrixAt(i, M) };
  api.instances = (geometry, material, items, parent = api.town, shadow = true) => {
    if (!items.length) return null;
    const im = new T.InstancedMesh(geometry, material, items.length);
    items.forEach((it, i) => { api.put(im, i, it); if (it.color) im.setColorAt(i, it.color) });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = shadow; im.receiveShadow = true; parent.add(im); return im;
  };
  api.WIDTH = { tertiary: 8, unclassified: 7, residential: 6, living_street: 5.5, service: 4.2, track: 3, footway: 1.7, path: 1.5, cycleway: 2, pedestrian: 4, steps: 1.5 };
});

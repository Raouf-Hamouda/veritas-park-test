/* VERITAS, the 3D model: the letters on the roof of building 13. His words: "this is the most important thing".
   They are built as the real ones are (photographs img/place/epp_9195.jpg and epp_9176.jpg): seven letters of one even stroke, standing free,
   each a real solid with a cream face; a thin orange tube runs along the middle of every stroke, as the neon does;
   behind them a frame of steel: three rails, posts, a diagonal in every bay, and stays down to the roof.
   The letters are drawn from their centre lines (the E is round, with its bar, as on the roof). In the evening the tubes and the faces glow. */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, HUE, mix } = api, b = api.b13, roof = api.roof13; if (!b || !roof) return;
  const H = 6.6, W = .95, D = 1, GAP = .3;   // height of a letter, width of its stroke, its depth, the space between two letters (in letter heights)
  const arc = (cx, cy, rx, ry, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] });
  const LETTERS = [   // width, then the centre lines of the strokes, in a space where the letter is 1 high
    [.88, [[0, 1], [.44, 0], [.88, 1]]],                                                                  // V
    [.8, arc(.5, .5, .5, .5, 52, 308, 20), [[.03, .5], [.78, .5]]],                                        // E, round with its bar
    [.74, [[0, 0], [0, 1], [.4, 1], ...arc(.4, .735, .3, .265, 90, -90, 12), [0, .47]], [[.34, .47], [.74, 0]]],   // R
    [0, [[0, 0], [0, 1]]],                                                                               // I
    [.8, [[0, 1], [.8, 1]], [[.4, 1], [.4, 0]]],                                                          // T
    [.9, [[0, 0], [.45, 1], [.9, 0]], [[.17, .36], [.73, .36]]],                                          // A
    [.7, [...arc(.35, .75, .33, .25, 25, 270, 13), ...arc(.35, .25, .33, .25, 90, -155, 13)]]];           // S
  const total = (LETTERS.reduce((s, l) => s + l[0], 0) + GAP * (LETTERS.length - 1)) * H;
  const group = new T.Group(); group.position.set((b.min.x + b.max.x) / 2 - total / 2, b.max.y + 2.1, b.max.z - 2.4); roof.add(group);
  const face = new T.MeshLambertMaterial({ color: mix(HUE.ocher[3], '#ffffff', .4), emissive: mix(HUE.ocher[3], '#ffffff', .4), emissiveIntensity: .55 }), tube = new T.MeshLambertMaterial({ color: HUE.brown[0], emissive: new T.Color(HUE.brown[0]), emissiveIntensity: .45 }), steel = new T.MeshLambertMaterial({ color: mix(HUE.turquoise[2], '#000000', .3) });
  const bars = [], knots = [], tubes = [], caps = [], M = (x, y, z, sx, sy, sz, rz = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, 0, rz)), new T.Vector3(sx, sy, sz));
  let x0 = 0;
  for (const [w, ...strokes] of LETTERS) {
    for (const s of strokes) { s.forEach(([px, py], i) => { const X = x0 + px * H, Y = py * H; knots.push(M(X, Y, 0, W, D, W)); caps.push(M(X, Y, D / 2 + .04, W * .7, .1, W * .7));
        if (!i) return; const [qx, qy] = s[i - 1], QX = x0 + qx * H, QY = qy * H, len = Math.hypot(X - QX, Y - QY), a = Math.atan2(Y - QY, X - QX);
        bars.push(M((X + QX) / 2, (Y + QY) / 2, 0, len, W, D, a)); tubes.push(M((X + QX) / 2, (Y + QY) / 2, D / 2 + .04, len, W * .7, .1, a)) }) }
    x0 += (w + GAP) * H;
  }
  const many = (geo, mat, list, shadow) => { const im = new T.InstancedMesh(geo, mat, list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.castShadow = shadow; group.add(im); return im };
  const round = new T.CylinderGeometry(.5, .5, 1, 16).rotateX(Math.PI / 2); many(new T.BoxGeometry(1, 1, 1), tube, bars, true); many(round, tube, knots, true); many(new T.BoxGeometry(1, 1, 1), face, tubes, false); many(round, face, caps, false);
  // the frame behind the letters
  const frame = [], zb = -D / 2 - .5, n = Math.round(total / 2.6), bay = (total + 2) / n;
  for (const y of [-1.9, H * .5, H + .5]) frame.push(M(total / 2, y, zb, total + 2.2, .14, .14));
  for (let i = 0; i <= n; i++) { const x = -1 + i * bay; frame.push(M(x, (H - 1.4) / 2, zb, .14, H + 2.4, .14)); if (i < n) frame.push(M(x + bay / 2, H * .75, zb, Math.hypot(bay, H * .5 + .5), .08, .08, (i % 2 ? 1 : -1) * Math.atan2(H * .5 + .5, bay)));
    if (i % 3 === 0) { const s = new T.Matrix4().compose(new T.Vector3(x, H * .25, zb - 2.6), new T.Quaternion().setFromEuler(new T.Euler(-.82, 0, 0)), new T.Vector3(.1, 7.6, .1)); frame.push(s) } }
  many(new T.BoxGeometry(1, 1, 1), steel, frame, true);
  api.hooks.push(() => { face.emissiveIntensity = .55 + api.evening * .4; tube.emissiveIntensity = .45 + api.evening * .55 });
  api.mark();
});

/* VERITAS, the 3D model: the water. The Stepenitz and the harbour of the Elbe, on their true outline (cut cleanly at the rim of the model).
   The water is not one flat colour. A picture of the shore is drawn once and softened: from it every point of the water knows how far it is
   from the bank. Near the bank the water is pale and shallow, it laps the bank in thin moving lines; towards the middle it turns deep.
   Long soft reflections of the sky drift on it, and small glints of sun. The colours are the turquoises of the book.
   Along the site the bank is a stone quay; elsewhere it is a strip of sand with reeds. */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, R, HUE, mix, scene, town } = api, waters = api.waters; if (!waters.length) return;
  // the picture of the shore: water white on black, softened, so that its grey says how far the bank is
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), px = v => (v + R) / (2 * R) * N, py = v => (R - v) / (2 * R) * N;
  x.fillStyle = '#000'; x.fillRect(0, 0, N, N); x.fillStyle = '#fff'; for (const p of waters) { x.beginPath(); p.forEach(([a, b], i) => i ? x.lineTo(px(a), py(b)) : x.moveTo(px(a), py(b))); x.closePath(); x.fill() }
  const soft = document.createElement('canvas'); soft.width = soft.height = N; const sx = soft.getContext('2d'); sx.filter = 'blur(11px)'; sx.drawImage(c, 0, 0);
  const field = new T.CanvasTexture(soft); field.minFilter = field.magFilter = T.LinearFilter; field.generateMipmaps = false;
  const mat = new T.ShaderMaterial({
    uniforms: { t: { value: 0 }, field: { value: field }, ext: { value: 2 * R }, shallow: { value: mix(HUE.turquoise[3], HUE.turquoise[0], .3) }, deep: { value: mix(HUE.turquoise[0], HUE.turquoise[1], .3) }, sky: { value: mix(HUE.turquoise[3], '#ffffff', .55) } },
    vertexShader: 'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `precision highp float; uniform float t, ext; uniform sampler2D field; uniform vec3 shallow, deep, sky; varying vec2 p;
      float h(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 q){ vec2 i = floor(q), f = fract(q); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
      float fbm(vec2 q){ float a = .5, s = 0.; for (int k = 0; k < 3; k++) { s += a * n(q); q = q * 2.03 + 17.; a *= .5; } return s; }
      void main(){
        float v = texture2D(field, p / ext + .5).r, d = smoothstep(.5, .97, v);                      // 0 at the bank, 1 in the middle of the river
        vec2 flow = vec2(t * .9, t * .35);                                                           // the river runs to the Elbe
        float w1 = fbm(p * .045 + flow * .05), w2 = fbm(p * vec2(.05, .15) - flow * .07 + w1 * 2.), w3 = n(p * .42 + flow * .3 + w2 * 1.5);
        vec3 col = mix(shallow, deep, d * (.72 + .28 * w1));                                         // pale near the bank, deep in the middle
        col = mix(col, sky, smoothstep(.5, .76, w2) * .34 * (.3 + .7 * d));                          // long reflections of the sky
        col += vec3(1.) * smoothstep(.72, .9, w3) * smoothstep(.45, .75, w2) * .26;                  // glints of sun
        col = mix(col, deep * .86, (1. - smoothstep(0., .16, d)) * .3);                              // the wet shade under the bank
        float lap = smoothstep(.55, .8, sin(d * 30. - t * 1.2 + w1 * 9.) * .5 + .5) * (1. - smoothstep(.03, .3, d)) * smoothstep(0., .035, d);
        col = mix(col, vec3(1.), lap * .5);                                                          // the water laps the bank
        gl_FragColor = vec4(col, 1.); }` });
  for (const p of waters) scene.add(api.lay(new T.Mesh(new T.ShapeGeometry(api.shapeOf(p)), mat), .2));
  api.hooks.push(now => { mat.uniforms.t.value = now / 1000 });

  // the banks. The edge that the rim of the model cuts is not a bank.
  let seed = 1870; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stone = new T.MeshLambertMaterial({ color: mix(HUE.ocher[3], HUE.ocher[1], .2) }), sand = new T.MeshLambertMaterial({ color: mix(HUE.ocher[3], HUE.brown[3], .5) }), reedMat = new T.MeshLambertMaterial({ color: '#ffffff' });
  const quay = [], cope = [], beach = [], dots = [], reeds = [], REED = [mix(HUE.soft[1], HUE.ocher[1], .4), mix(HUE.soft[1], HUE.soft[2], .3), mix(HUE.green[1], HUE.ocher[1], .3)];
  for (const p of waters) for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length]; if (Math.hypot(a[0], a[1]) > R - 5 && Math.hypot(b[0], b[1]) > R - 5) continue;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < .3) continue; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(dy, dx);
    if (api.zoneAt(mx + dy / len * 6, my - dx / len * 6) || api.zoneAt(mx - dy / len * 6, my + dx / len * 6)) {   // along the site: a quay of stone with its coping
      quay.push({ x: mx, y: .45, z: -my, sx: len + 1.2, sy: .9, sz: 1.5, ry: ang }); cope.push({ x: mx, y: .96, z: -my, sx: len + 1.5, sy: .14, sz: 1.9, ry: ang });
    } else {                                                                                                     // elsewhere: sand, and reeds in tufts
      beach.push({ x: mx, y: .26, z: -my, sx: len, sz: 4.4, ry: ang }); dots.push({ x: a[0], y: .26, z: -a[1], sx: 4.4, sz: 4.4 });
      for (let d = rnd() * 5; d < len; d += 3 + rnd() * 7) { const cx = a[0] + dx / len * d, cy = a[1] + dy / len * d, n = 3 + Math.floor(rnd() * 5);
        for (let k = 0; k < n; k++) { const hgt = 1.4 + rnd() * 1.6; reeds.push({ x: cx + (rnd() - .5) * 2.6, y: hgt / 2 + .2, z: -(cy + (rnd() - .5) * 2.6), sx: .5, sy: hgt, sz: .5, ry: rnd() * 3, color: REED[Math.floor(rnd() * 3)] }) } }
    }
  }
  api.instances(api.quad, sand, beach, town, false); api.instances(api.disc, sand, dots, town, false);
  api.instances(api.box, stone, quay, town); api.instances(api.box, new T.MeshLambertMaterial({ color: mix(HUE.ocher[3], '#ffffff', .5) }), cope, town, false);
  api.instances(new T.ConeGeometry(.5, 1, 5), reedMat, reeds, town, false);
});

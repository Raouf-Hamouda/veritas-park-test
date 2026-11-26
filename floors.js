/* VERITAS, the floor plans of building 13 as a stack (Rent page). Needs lib/three.min.js.
   The nine plans of the live site are the nine floors of one building, so they are shown as that: one above the other, drawn without perspective.
   Drag: the stack turns. Choose a floor, in the list or on the stack: it slides forward out of the stack, the camera rises above it so the plan
   can be read, and the other floors step back. Choose it again: it goes back to its place.
   The plans keep their own paper: black lines on white, nothing redrawn. */
(() => {
  const T = window.THREE, view = document.querySelector('.stack .view'); if (!T || !view) return;
  const files = view.dataset.floors.split(','), list = view.parentNode.querySelector('.floors'), btns = [...list.querySelectorAll('button')], canvas = view.querySelector('canvas'), N = files.length;
  let renderer; try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }) } catch (e) { const im = document.createElement('img'); im.className = 'flat'; view.append(im); const pick = i => { im.src = files[i]; btns.forEach((b, k) => b.setAttribute('aria-selected', k === i)) }; btns.forEach((b, i) => b.addEventListener('click', () => pick(i))); pick(7); return }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new T.Scene(), cam = new T.OrthographicCamera(-1, 1, 1, -1, -2000, 4000), loader = new T.TextureLoader(), GAP = 34, WIDE = 300;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  // one floor: its plan on a thin white slab with a dark edge. Floor 0 of the list is the roof, so it stands highest.
  const floors = files.map((src, i) => { const g = new T.Group(), y = (N - 1 - i) * GAP; g.position.y = y; scene.add(g);
    const mat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true }), slab = new T.Mesh(new T.PlaneGeometry(1, 1), mat); slab.rotation.x = -Math.PI / 2; g.add(slab);
    const edge = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1, 1)), new T.LineBasicMaterial({ color: 0x000000, transparent: true })); edge.rotation.x = -Math.PI / 2; g.add(edge);
    loader.load(src, tex => { tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); mat.map = tex; mat.needsUpdate = true; const d = WIDE * tex.image.height / tex.image.width; slab.scale.set(WIDE, d, 1); edge.scale.set(WIDE, d, 1); dirty = true });
    slab.scale.set(WIDE, WIDE * .55, 1); edge.scale.set(WIDE, WIDE * .55, 1); slab.userData.i = i;
    return { g, mat, edge, slab, y, out: 0, dim: 0 } });
  let sel = 7, az = .62, el = .5, elTo = .5, zoom = 1, zoomTo = 1, cy = 0, cyTo = 0, cz = 0, czTo = 0, dirty = true, visible = false, W = 1, H = 1, drag = null, opened = false;
  const mid = (N - 1) * GAP / 2;
  function pick(i, open = true) { opened = i === sel && opened ? false : open; sel = i; btns.forEach((b, k) => b.setAttribute('aria-selected', k === i));
    elTo = opened ? 1.08 : .5; zoomTo = opened ? 1.9 : 1; cyTo = opened ? floors[i].y : mid; czTo = opened ? 120 : 0; dirty = true }
  btns.forEach((b, i) => b.addEventListener('click', () => pick(i)));
  // the hand: drag turns the stack; a click on a floor chooses it
  const ray = new T.Raycaster(), mouse = new T.Vector2();
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az, el: elTo, cy: cyTo, moved: 0, pan: e.shiftKey || e.button === 2 }; canvas.setPointerCapture(e.pointerId) });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy)); if (drag.moved > 4) { if (drag.pan) cy = cyTo = drag.cy + dy * .9 / zoom; else { az = drag.az - dx * .006; if (e.pointerType === 'mouse') el = elTo = clamp(drag.el + dy * .005, .12, 1.5) } dirty = true } });
  // the wheel zooms; a wheel that was already scrolling the page goes on scrolling it. A double click puts the stack back as it was.
  let lastScroll = 0; addEventListener('scroll', () => lastScroll = performance.now(), { passive: true });
  canvas.addEventListener('wheel', e => { const pinchy = e.ctrlKey || e.metaKey; if (!pinchy && (performance.now() - lastScroll < 420 || (e.deltaY > 0 && zoomTo <= .71))) return; e.preventDefault(); zoomTo = clamp(zoomTo * Math.exp(-e.deltaY * (pinchy ? .012 : .0026)), .7, 6); dirty = true }, { passive: false });
  canvas.addEventListener('dblclick', () => { az = .62; opened = false; pick(sel, false) });
  canvas.addEventListener('pointerup', e => { const d = drag; drag = null; if (!d || d.moved > 4) return; const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, cam); const hit = ray.intersectObjects(floors.map(f => f.slab))[0]; if (hit) pick(hit.object.userData.i) });
  canvas.addEventListener('pointercancel', () => drag = null);
  function size() { W = view.clientWidth; H = view.clientHeight; if (!W || !H) return; renderer.setSize(W, H, false); dirty = true }
  function frame() { if (!visible) return; requestAnimationFrame(frame); let moving = false; const k = calm ? 1 : .09;
    for (const [i, f] of floors.entries()) { const out = opened && i === sel ? 1 : 0, dim = opened && i !== sel ? 1 : i === sel ? 0 : .35;
      if (Math.abs(out - f.out) > .002 || Math.abs(dim - f.dim) > .002) { f.out = lerp(f.out, out, k); f.dim = lerp(f.dim, dim, k); f.g.position.z = f.out * 120; f.mat.opacity = 1 - f.dim * .86; f.edge.material.opacity = 1 - f.dim * .7; f.g.renderOrder = i === sel ? 2 : 1; moving = true } }
    for (const [a, b, set] of [[el, elTo, v => el = v], [zoom, zoomTo, v => zoom = v], [cy, cyTo, v => cy = v], [cz, czTo, v => cz = v]]) if (Math.abs(a - b) > .001) { set(lerp(a, b, k)); moving = true }
    if (!moving && !dirty) return; dirty = false;
    const half = 300 / zoom; cam.left = -half * Math.max(1, W / H * .78); cam.right = -cam.left; cam.top = cam.right * H / W; cam.bottom = -cam.top; cam.updateProjectionMatrix();
    cam.position.set(Math.sin(az) * Math.cos(el) * 900, cy + Math.sin(el) * 900, cz + Math.cos(az) * Math.cos(el) * 900); cam.lookAt(0, cy, cz); renderer.render(scene, cam) }
  new ResizeObserver(size).observe(view); size(); cy = cyTo = mid; pick(7, false);
  new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was) { dirty = true; requestAnimationFrame(frame) } }).observe(view);
  // a floor chosen on the 3D model of the site arrives here by its link (rent.html#floor-3)
  const fromLink = () => { const m = /^#floor-(\d)$/.exec(location.hash); if (m) { sel = -1; pick(+m[1], true); setTimeout(() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' }), 400) } }; fromLink(); addEventListener('hashchange', fromLink);
})();

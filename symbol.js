/* VERITAS, the symbol that builds itself. This is the move chosen on 20 Nov (SYMBOL.html), made usable anywhere on the site.
   The twelve ticks of the symbol, by hour: length, width and distance of the middle from the centre, as measured on the book's file.
   The move: the symbol is built round the circle, clockwise. The 12 o'clock tick grows first; then each tick comes out of the one
   before it, turns one hour further and grows to its own length, up to 11 o'clock.
   window.veritasSymbol(svg) draws the symbol in an svg whose viewBox is centred on 0 0 (for instance -40 -40 80 80) and gives back:
     build(seconds)  plays the whole move      set(hour, p)  places one tick part of the way (p from 0 to 1) out of the one before it
     ticks           the twelve rectangles      K             the measures */
(() => {
  const K = [{ len: 10.02, w: 3.7, r: 31.995 }, { len: 10.786, w: 3.701, r: 31.616 }, { len: 11.568, w: 3.696, r: 31.229 }, { len: 12.33, w: 3.7, r: 30.835 }, { len: 13.107, w: 3.701, r: 30.46 }, { len: 13.88, w: 3.696, r: 30.071 },
    { len: 14.65, w: 3.7, r: 29.68 }, { len: 15.423, w: 3.701, r: 29.295 }, { len: 16.189, w: 3.701, r: 28.907 }, { len: 16.96, w: 3.7, r: 28.52 }, { len: 17.726, w: 3.701, r: 28.141 }, { len: 18.499, w: 3.696, r: 27.757 }];
  const NS = 'http://www.w3.org/2000/svg', out = t => 1 - Math.pow(1 - t, 4), calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  window.veritasSymbol = svg => {
    const ticks = K.map(k => { const e = document.createElementNS(NS, 'rect'); e.setAttribute('x', -k.w / 2); e.setAttribute('y', -k.len / 2); e.setAttribute('width', k.w); e.setAttribute('height', k.len); e.setAttribute('class', 'tk'); svg.appendChild(e); return e });
    // one tick, part of the way: it leaves the place and the length of the tick before it and reaches its own
    const set = (h, p) => { const k = K[h], from = h ? K[h - 1].len : 0, L = from + (k.len - from) * p, a = h ? (h - 1 + p) * 30 : 0;
      ticks[h].setAttribute('transform', `rotate(${a}) translate(0 ${L / 2 - k.r - k.len / 2}) scale(1 ${Math.max(L / k.len, .0001)})`); ticks[h].style.visibility = p > 0 ? 'visible' : 'hidden' };
    const all = p => K.forEach((k, h) => set(h, p));
    // the whole move. step: seconds between two ticks. dur: seconds one tick takes.
    const build = (step = .17, dur = .42, start = .1) => new Promise(done => { if (calm) { all(1); return done() } all(0); const t0 = performance.now();
      const frame = now => { const t = (now - t0) / 1000; let busy = false; K.forEach((k, h) => { const p = Math.min(1, Math.max(0, (t - start - h * step) / dur)); set(h, out(p)); if (p < 1) busy = true }); busy ? requestAnimationFrame(frame) : done() };
      requestAnimationFrame(frame) });
    // one tick alone comes out of the one before it (used when the opening goes to its next picture)
    const step = (h, ms = 620) => new Promise(done => { if (calm) { set(h, 1); return done() } const t0 = performance.now(); const frame = now => { const p = Math.min(1, (now - t0) / ms); set(h, out(p)); p < 1 ? requestAnimationFrame(frame) : done() }; requestAnimationFrame(frame) });
    // move 02 of the ten (picked by him, 22 Nov): one hand sweeps round without stopping, grows, and leaves a tick at each hour
    const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, cl = v => Math.min(1, Math.max(0, v));
    const place = (h, a, L, on) => { const k = K[h]; ticks[h].setAttribute('transform', `rotate(${a}) translate(0 ${L / 2 - k.r - k.len / 2}) scale(1 ${Math.max(L / k.len, .0001)})`); ticks[h].style.visibility = on ? 'visible' : 'hidden' };
    const sweep = (secs = 2.8) => new Promise(done => { if (calm) { all(1); return done() } all(0); const t0 = performance.now(), f = secs / 2.8;
      const frame = now => { const t = (now - t0) / 1000 / f, th = io(cl((t - .3) / 2.3)) * 330;
        K.forEach((k, h) => { if (!h) return place(0, 0, k.len * out(cl(t / .3)), t > 0); if (th >= h * 30) return place(h, h * 30, k.len, true);
          h === Math.floor(th / 30) + 1 && th > 0 ? place(h, th, K[h - 1].len + (k.len - K[h - 1].len) * (th / 30 - h + 1), true) : place(h, 0, k.len, false) });
        t < 2.8 ? requestAnimationFrame(frame) : (all(1), done()) }; requestAnimationFrame(frame) });
    all(1); return { build, set, step, all, sweep, ticks, K };
  };
  // every svg marked data-symbol is drawn at once; the one of the arrival screen plays the move
  // the footer: the round logo itself is built by move 02. A hand sweeps round from 12; each letter and each line of the logo takes its place as the hand passes its hour.
  const foot = document.querySelector('.footer .logo'), mk = foot && foot.querySelector('.mk');
  if (mk && !calm && location.protocol !== 'file:') fetch('img/logo_round.svg').then(r => r.text()).then(txt => {
    const ds = [...txt.matchAll(/ d="([^"]+)"/g)].map(m => m[1]); if (ds.length < 8) return;
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 296 296.01'); svg.setAttribute('class', 'foot-logo'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'VERITAS');
    const parts = ds.map(d => { const e = document.createElementNS(NS, 'path'); e.setAttribute('d', d); svg.appendChild(e); return e });
    mk.replaceWith(svg);
    const hours = parts.map(e => { const q = e.getBBox(), x = q.x + q.width / 2, y = q.y + q.height / 2; e.style.transformOrigin = `${x}px ${y}px`; let deg = Math.atan2(x - 148, 148 - y) * 180 / Math.PI; if (deg < -12) deg += 360; return deg });
    const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); const t0 = performance.now();
      const frame = now => { const t = (now - t0) / 1000, th = io(Math.min(1, Math.max(0, (t - .15) / 2.5))) * 352;
        parts.forEach((e, i) => { if (th >= hours[i] - 6) e.classList.add('on') }); if (t < 2.8) requestAnimationFrame(frame); else parts.forEach(e => e.classList.add('on')) };
      requestAnimationFrame(frame) }, { threshold: .4 }).observe(foot);
  }).catch(() => {});
  // the dial of a form: its twelve ticks come on one after the other as the questions are answered
  document.querySelectorAll('svg[data-progress]').forEach(s => { const sym = window.veritasSymbol(s), show = f => sym.ticks.forEach((t, h) => t.classList.toggle('on', h < Math.round(f * 12))); addEventListener('veritas-progress', e => show(e.detail)); show(0) });
  document.querySelectorAll('svg[data-symbol]').forEach(s => { const sym = window.veritasSymbol(s); if (s.closest('.gate')) sym.sweep(1.05) });   // the arrival: move 02 (one hand sweeps round and leaves a tick at each hour), in one second
})();

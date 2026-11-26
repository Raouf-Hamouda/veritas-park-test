/* VERITAS, the script of the website. Small jobs only: the arrival tile, the clock in the logo, the menu,
   the header that follows the ground under it, things arriving once, the arc, the square rows, the floors. */
(() => {
  const D = document, root = D.documentElement, body = D.body, $ = (s, e = D) => e.querySelector(s), $$ = (s, e = D) => [...e.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  // the arrival: once per visit, the tile builds its twelve ticks, then the page opens
  const gate = $('.gate'); let seen = false; try { seen = sessionStorage.getItem('v-gate'); sessionStorage.setItem('v-gate', 1) } catch (e) {}
  if (gate) { if (seen || calm) gate.remove(); else setTimeout(() => { gate.classList.add('off'); setTimeout(() => gate.remove(), 500) }, 1200) }

  // the logo is a clock set to the time in Wittenberge
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
  const now = () => { const p = {}; for (const x of fmt.formatToParts(new Date())) p[x.type] = +x.value; return [(p.hour % 12 + p.minute / 60) * 30, p.minute * 6 + p.second / 10, p.second * 6] };
  const clock = () => { const a = now(); $$('.clock').forEach(svg => $$('.hand', svg).forEach((h, i) => h.setAttribute('transform', `rotate(${a[i]} ${h.getAttribute('x1')} ${h.getAttribute('y1')})`))) };
  clock(); setInterval(clock, 1000); window.veritasTime = now;

  // the menu
  const btn = $('.menu-btn'), nav = $('.nav');
  const menu = on => { root.classList.toggle('nav-open', on); btn.setAttribute('aria-expanded', on); btn.textContent = on ? 'Close' : 'Menu'; nav.toggleAttribute('inert', !on); if (on) tint.content = '#000000'; else scroll() };   // the phone's own bar is dark while the menu is open, whatever the page under it
  btn && btn.addEventListener('click', () => menu(!root.classList.contains('nav-open')));
  nav && nav.addEventListener('touchmove', e => { if (nav.scrollHeight <= nav.clientHeight + 1) e.preventDefault() }, { passive: false });   // the page behind an open menu does not scroll
  addEventListener('keydown', e => { if (e.key === 'Escape') menu(false); if ((e.key === 'g' || e.key === 'G') && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { body.classList.toggle('grid'); scroll() } });

  // square rows (p36): every block ends on a row of the grid
  const probe = D.createElement('i'); probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--row);height:0'; body.append(probe);
  let row = 100; const blocks = $$('main>section,footer').filter(s => !s.matches('.top2,.call2,.hero,.wheel-sec,.urb'));   // the blocks that fill one screen keep the height of the screen
  const snap = () => { row = probe.getBoundingClientRect().width; const all = $$('main>section,footer'), mark = all.find(s => s.getBoundingClientRect().bottom > 80), t0 = mark ? mark.getBoundingClientRect().top : 0;
    for (const s of blocks) { s.style.minHeight = ''; } for (const s of blocks) { const h = s.getBoundingClientRect().height; s.style.minHeight = Math.ceil((h - 1) / row) * row + 'px' }
    if (mark) { const d = mark.getBoundingClientRect().top - t0; if (Math.abs(d) > 1) scrollBy({ top: d, behavior: 'instant' }) } };   // the block being read never moves when the rows are set again

  const tint = $('meta[name=theme-color]') || D.head.appendChild(Object.assign(D.createElement('meta'), { name: 'theme-color' }));   // the colour a phone gives to its own bars
  // the header takes the ink of the ground under it; a few things follow the scroll
  const head = $('.head'), arc = $('.arc'), bleeds = $$('.bleed');
  // The bar has two states: A, bare and large over the opening picture (the top of a page); B, small on its strip (after a scroll).
  // His words (23 Nov): "state A leads to state A, state B leads to state B". So the state is carried to the next page: a page left in B opens in B, although it opens at its top,
  // and the bar does not jump during the change. Only the scroll changes the state: once the visitor has gone past the first lines, the usual rule is back (A at the very top, B below).
  // (The page itself puts the class on before its first picture: the small script in its head.)
  let held = false; try { held = sessionStorage.getItem('v-bar') === 'b'; sessionStorage.removeItem('v-bar') } catch (e) {}
  addEventListener('pagehide', () => { try { sessionStorage.setItem('v-bar', root.classList.contains('scrolled') ? 'b' : 'a') } catch (e) {} });
  let tick = 0; const scroll = () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; place() }) }, place = () => {
    if (held && scrollY > 30) held = false;
    root.classList.toggle('at-top', scrollY < innerHeight * .6); root.classList.toggle('scrolled', held || scrollY > 30); root.classList.toggle('at-end', scrollY + innerHeight > root.scrollHeight - innerHeight * .6);
    const g = D.elementsFromPoint(innerWidth / 2, head.offsetHeight / 2).find(e => e.dataset && e.dataset.ground); head.classList.toggle('on-dark', !!g && g.dataset.ground === 'dark'); const darkTop = head.classList.contains('on-dark') || root.classList.contains('at-top'); root.classList.toggle('dark-top', darkTop); tint.content = darkTop ? '#000000' : '#ffffff';
    if (arc && !calm) { const r = arc.getBoundingClientRect(), p = (innerHeight - r.top) / (innerHeight + r.height); if (p > -.2 && p < 1.2) arc.style.setProperty('--turn', ((.5 - p) * 26).toFixed(2) + 'deg') }
    if (!calm) for (const b of bleeds) { const r = b.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) b.style.setProperty('--par', ((innerHeight - r.top) / (innerHeight + r.height)).toFixed(3)) }
    if (body.classList.contains('grid')) body.style.setProperty('--gy', -(scrollY % row) + 'px') };
  addEventListener('scroll', scroll, { passive: true }); let wide = innerWidth; addEventListener('resize', () => { if (innerWidth !== wide) { wide = innerWidth; snap() } scroll() });   // the rows change only when the width does (a phone resizes at every slide of its browser bar)
  snap(); place(); (D.fonts ? D.fonts.ready : Promise.resolve()).then(() => { snap(); scroll() }); addEventListener('load', () => { snap(); scroll() });

  // things arrive once; icons draw themselves line after line
  $$('.draw').forEach(svg => $$('path', svg).forEach((p, i) => { p.setAttribute('pathLength', 1); p.style.setProperty('--i', i) }));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal,.draw').forEach(e => io.observe(e));
  // on a phone nothing hovers: the field in the middle of the screen lights up
  if (matchMedia('(hover:none)').matches) { const mid = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('lit-on', e.isIntersecting)), { rootMargin: '-50% 0px -50% 0px' }); $$('.fld').forEach(f => mid.observe(f)) }

  // the building, floor by floor
  $$('.floors').forEach(list => { if (list.closest('.stack')) return;   // the stacked plans have their own script (floors.js)
    const imgs = $$('.plan img', list.closest('section')), bs = $$('button', list);
    const pick = i => { bs.forEach((b, k) => b.setAttribute('aria-selected', k === i)); imgs.forEach((m, k) => m.classList.toggle('on', k === i)) };
    bs.forEach((b, i) => { b.addEventListener('click', () => pick(i)); b.addEventListener('mouseenter', () => pick(i)) });
    const fromLink = () => { const m = /^#floor-(\d)$/.exec(location.hash); if (m) { pick(+m[1]); setTimeout(() => list.closest('section').scrollIntoView({ behavior: 'smooth' }), 350) } }; fromLink(); addEventListener('hashchange', fromLink) });   // a floor chosen on the 3D model opens its plan here

  // the pill is a little magnetic under the pointer (a mouse only)
  if (matchMedia('(hover:hover)').matches && !calm) $$('.btn').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px'); b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px') }); b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px') }) });

  // a picture opens to the full screen from where it stands, and goes back to its place (the wheel and the gallery use it)
  window.veritasOpen = (img, title = '', line = '') => {
    const frame = img.closest('.card') || img.parentElement, r = frame.getBoundingClientRect(), nw = img.naturalWidth || r.width, nh = img.naturalHeight || r.height, m = innerWidth < 820 ? 14 : 56;
    const k = Math.min((innerWidth - 2 * m) / nw, (innerHeight - 2 * m) / nh), tw = nw * k, th = nh * k, tx = (innerWidth - tw) / 2, ty = (innerHeight - th) / 2;
    // where the picture stands now, said in the terms of the big picture: a scale, a place, and the part of it that shows
    const s0 = Math.max(r.width / tw, r.height / th), ox = r.left + r.width / 2 - tw * s0 / 2, oy = r.top + r.height / 2 - th * s0 / 2, ix = (tw * s0 - r.width) / 2 / s0, iy = (th * s0 - r.height) / 2 / s0;
    const from = { transform: `translate(${ox}px,${oy}px) scale(${s0})`, clipPath: `inset(${iy}px ${ix}px)` }, to = { transform: `translate(${tx}px,${ty}px) scale(1)`, clipPath: 'inset(0px 0px)' };
    const box = D.createElement('figure'); box.className = 'lb'; box.innerHTML = `<img alt=""><figcaption><b></b><span></span></figcaption><button class="round" aria-label="Close"><svg class="ico" viewBox="0 0 100 100"><path d="M12.5 12.5L87.5 87.5"/><path d="M87.5 12.5L12.5 87.5"/></svg></button>`;
    const big = box.firstChild; big.src = (innerWidth * (devicePixelRatio || 1) > 1300 && img.getAttribute('src')) || img.currentSrc || img.src;   // on a large screen the full-screen picture is the large file
    big.style.width = tw + 'px'; big.style.height = th + 'px'; big.style.transition = 'none'; Object.assign(big.style, from);
    box.querySelector('b').textContent = title; box.querySelector('span').textContent = line; body.append(box); body.classList.add('lb-open'); img.style.visibility = 'hidden';
    const spring = 'transform .7s cubic-bezier(.19,1,.22,1),clip-path .7s cubic-bezier(.19,1,.22,1)';
    requestAnimationFrame(() => requestAnimationFrame(() => { big.style.transition = calm ? 'none' : spring; Object.assign(big.style, to); box.classList.add('on') }));
    // closing: the picture goes back to where its place is NOW (the page or the wheel may have moved), quicker than it came, and its place shows again the moment it lands
    const back = () => { const q = frame.getBoundingClientRect(), z = Math.max(q.width / tw, q.height / th);
      return { transform: `translate(${q.left + q.width / 2 - tw * z / 2}px,${q.top + q.height / 2 - th * z / 2}px) scale(${z})`, clipPath: `inset(${(th * z - q.height) / 2 / z}px ${(tw * z - q.width) / 2 / z}px)` } };
    let shut = false; const close = () => { if (shut) return; shut = true; removeEventListener('keydown', key); removeEventListener('scroll', moved); box.classList.remove('on'); body.classList.remove('lb-open');
      const end = () => { img.style.visibility = ''; box.remove() }; if (calm) return end();
      big.style.transition = 'transform .48s cubic-bezier(.3,.7,.2,1),clip-path .48s cubic-bezier(.3,.7,.2,1)'; Object.assign(big.style, back());
      let done = false; const fin = () => { if (done) return; done = true; end() }; big.addEventListener('transitionend', fin, { once: true }); setTimeout(fin, 560) };
    const y0 = scrollY, moved = () => { if (Math.abs(scrollY - y0) > 60) close() };   // a real scroll closes it, not the last drift of a trackpad
    const key = e => { if (e.key === 'Escape') close() }; addEventListener('keydown', key); box.addEventListener('click', close); addEventListener('scroll', moved, { passive: true });
  };
  $$('.mosaic button').forEach(b => b.addEventListener('click', () => window.veritasOpen(b.querySelector('img'))));

  // the line of news is pulled sideways with the mouse, like with a finger; two round buttons move it by one news
  $$('.strip').forEach(st => { let d = null; const one = () => st.querySelector('article').getBoundingClientRect().width + parseFloat(getComputedStyle(st).columnGap || 0);
    st.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button) return; d = { x: e.clientX, left: st.scrollLeft, moved: 0 } });
    addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x; d.moved = Math.max(d.moved, Math.abs(dx)); if (d.moved > 4) st.classList.add('drag'); st.scrollLeft = d.left - dx });
    addEventListener('pointerup', () => { if (!d) return; const moved = d.moved; d = null; if (moved > 4) { st.addEventListener('click', e => { e.preventDefault(); e.stopPropagation() }, { once: true, capture: true }); const to = Math.round(st.scrollLeft / one()) * one(); st.scrollTo({ left: to, behavior: 'smooth' }); setTimeout(() => st.classList.remove('drag'), 450) } });
    st.parentNode.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => st.scrollBy({ left: +b.dataset.move * one(), behavior: 'smooth' }))) });

  // a pill that is a button catches a little light where the pointer is
  $$('a.pill').forEach(p => p.addEventListener('pointermove', e => { const r = p.getBoundingClientRect(); p.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); p.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%') }));

  // "others, please specify" shows its line only when picked
  $$('[data-if]').forEach(el => { const [name, val] = el.dataset.if.split('='); const sync = () => { const c = $(`[name="${name}"]:checked`); el.hidden = !(c && c.value === val) }; $$(`[name="${name}"]`).forEach(i => i.addEventListener('change', sync)); sync() });

  // a long sentence is set smaller than a short one, in both languages
  // a word written with a hyphen (co-create) is never cut at its hyphen
  const joined = () => { const w = D.createTreeWalker($('main'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/\w-\w/.test(n.nodeValue) && n.parentElement.closest('h1,h2,h3,blockquote,.t-serif,.t-line,button,li,.nl-c')) n.nodeValue = n.nodeValue.replace(/(\w)-(?=\w)/g, '$1-\u2060') };
  const fit = () => { joined(); $$('.t-serif,.t-line,.t-caps,.quote').forEach(e => { const n = e.textContent.trim().length; e.classList.toggle('long', n > 70 && n <= 150); e.classList.toggle('xlong', n > 150) }) };
  fit(); snap(); addEventListener('veritas-lang', () => { fit(); snap(); scroll() });

  // going to another page: this one fades out, the next one fades in
  D.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return; const href = a.getAttribute('href');
    if (!/^[\w-]+\.html(#.*)?$/.test(href) || href.split('#')[0] === (location.pathname.split('/').pop() || 'index.html')) return; });   // (the fade is now done by the browser itself: see @view-transition in the style file)
  addEventListener('pageshow', () => body.classList.remove('leaving'));

  // a form tells its dial how far it is: the share of its questions that have an answer
  $$('.form').forEach(form => { const tell = () => { const names = [...new Set($$('input,textarea', form).filter(i => !i.closest('[hidden]')).map(i => i.name))];
      const done = names.filter(n => { const els = $$('input,textarea', form).filter(i => i.name === n); return els[0].type === 'radio' ? els.some(x => x.checked) : els[0].value.trim() });
      dispatchEvent(new CustomEvent('veritas-progress', { detail: names.length ? done.length / names.length : 0 })) };
    form.addEventListener('input', tell); form.addEventListener('change', tell); addEventListener('load', tell) });

  // a picture that arrives late changes the height of its block: the square rows are set again
  let late = 0;
  // a block that grows past its rows after the first setting (a font or a logo that arrives late) is set on the rows again
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { clearTimeout(late); late = setTimeout(() => { snap(); scroll() }, 120) }); blocks.forEach(b => ro.observe(b)) }
  D.addEventListener('load', e => { if (e.target.tagName === 'IMG' && !e.target.closest('.fl-ui,.lb,.hero,.wheel,.col-pic,.top2,.call2,.bleed')) { clearTimeout(late); late = setTimeout(() => { snap(); scroll() }, 120) } }, true);

  addEventListener('pageshow', e => { if (e.persisted) held = false; scroll() }); D.addEventListener('visibilitychange', scroll);   // the ink of the menu bar is set again whenever the page is shown
  // the next page is fetched as soon as the pointer comes near its link, so that it is there at once; and its first picture is fetched ahead
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) { const sp = D.createElement('script'); sp.type = 'speculationrules'; sp.textContent = JSON.stringify({ prefetch: [{ where: { selector_matches: '.bar a, .nav a.sign, a.sbtn[href$=".html"]' }, eagerness: 'moderate' }] }); D.head.append(sp) }
  const small = innerWidth * (devicePixelRatio || 1) <= 1300, slow = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));   // a phone takes the phone-size copies (img/place/m); a visitor who saves data takes none in advance
  if (!slow) addEventListener('load', () => setTimeout(() => ['b7_140', 'aerial_0', 'b4roof_038', 'b13_132', 'epp_9195'].forEach(n => { new Image().src = `img/place/${small ? 'm/' : ''}${n}.jpg` }), 2500));
})();

/* the newsletter card: comes up once per visitor, after a while on the site or once half a page is read; closed by the cross, Escape or a click beside it */
(() => {
  const D = document; let seen = null; try { seen = localStorage.getItem('v-news') } catch (e) {}
  const box = (v, sub) => `<label class="nl-c${sub ? ' sub' : ''}"><input type="checkbox" name="Interests" value="${v}" checked><i aria-hidden="true"></i><span>${v}</span></label>`;
  const el = D.createElement('div'); el.className = 'nl'; el.hidden = true;
  el.innerHTML = `<form class="nl-card" action="mailto:info@veritas-park.eu?subject=Newsletter" method="post" enctype="text/plain" role="dialog" aria-modal="true" aria-labelledby="nl-t">
    <button type="button" class="nl-x" aria-label="Close"><svg class="ico" viewBox="0 0 100 100"><path d="M12.5 12.5L87.5 87.5"/><path d="M87.5 12.5L12.5 87.5"/></svg></button>
    <div class="nl-side dark end"><div class="nl-logo" aria-hidden="true"><i class="mk"></i></div><div class="nl-head"><b id="nl-t">Be the first to know</b><span>Subscribe to receive our newsletter on the place, its spaces, events and more</span></div></div>
    <div class="nl-main">
    <fieldset class="nl-pick"><legend>I am interested in</legend>${box('News from VERITAS')}${box('Events and Club')}${box('Spaces to rent')}${['Offices and Co-working', 'Work Spaces', 'Conference Hall', 'Light Industry'].map(v => box(v, 1)).join('')}${box('Invest')}</fieldset>
    <div class="nl-send"><label class="nl-mail"><span>E-Mail *</span><input type="email" name="E-Mail" required autocomplete="email"></label>
      <button class="sbtn nl-go" type="submit"><span>Sign up</span><svg class="curve" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M100 96.4A96.4 96.4 0 0 1 3.6 0"/></svg></button>
      <p>You can withdraw your consent at any time with the unsubscribe link in each newsletter</p><a href="privacy.html">Privacy Policy</a></div></div></form>`;
  D.body.append(el);
  const all = [...el.querySelectorAll('input[type=checkbox]')], parent = all[2], kids = all.slice(3, 7);
  parent.addEventListener('change', () => kids.forEach(k => k.checked = parent.checked)); kids.forEach(k => k.addEventListener('change', () => parent.checked = kids.some(x => x.checked)));
  const done = () => { try { localStorage.setItem('v-news', '1') } catch (e) {} };
  const close = () => { el.classList.remove('on'); D.removeEventListener('keydown', key); done(); setTimeout(() => el.hidden = true, 500) };
  const key = e => { if (e.key === 'Escape') close() };
  el.querySelector('.nl-x').addEventListener('click', close); el.addEventListener('click', e => { if (e.target === el) close() });
  el.querySelector('form').addEventListener('submit', () => { done(); setTimeout(close, 300) });
  const ask = /[?&]newsletter\b/.test(location.search);   // ?newsletter shows the card at once (to look at it)
  // a sign of a page can open the card too (data-newsletter)
  const open = () => { el.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on'))); D.addEventListener('keydown', key) };
  D.querySelectorAll('[data-newsletter]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open() }));
  if (seen && !ask) return;
  let shown = false; const show = () => { if (shown) return; const b = D.body; if (b.classList.contains('lb-open') || D.documentElement.classList.contains('nav-open') || D.querySelector('.lb')) { setTimeout(show, 4000); return }
    shown = true; removeEventListener('scroll', half); el.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on'))); D.addEventListener('keydown', key) };
  const half = () => { if (scrollY > (D.documentElement.scrollHeight - innerHeight) * .5) show() };
  addEventListener('scroll', half, { passive: true }); setTimeout(show, ask ? 600 : 25000);
})();

/* the language switch keeps its plain look (EN | DE); the line between them is one tick of the logo and moves like a clock hand: it leans toward the language chosen, with a small spring. A click on it changes language. */
(() => {
  document.querySelectorAll('.lang').forEach(l => { const [en, de] = l.querySelectorAll('[data-lang]'); if (!en || !de || l.querySelector('.lang-tick')) return;
    const t = document.createElement('button'); t.type = 'button'; t.className = 'lang-tick'; t.setAttribute('aria-label', 'EN / DE'); t.innerHTML = '<i></i>';
    t.addEventListener('click', () => (document.documentElement.lang === 'de' ? en : de).click()); en.after(t) });
})();

/* past the page end (a phone's bottom bar, an overscroll) the colour is the one at the foot of the page, in its own hue */
(() => { const f = document.querySelector('.footer'); if (!f) return; const h = getComputedStyle(f).getPropertyValue('--h-dark').trim() || '#421616';
  const hex = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h), rgb = /(\d+)\D+(\d+)\D+(\d+)/.exec(h), c = hex ? hex.slice(1).map(x => parseInt(x, 16)) : rgb ? rgb.slice(1).map(Number) : null;
  if (c) document.documentElement.style.backgroundColor = `rgb(${c.map(v => Math.round(v * .62)).join(',')})` })();

/* the phone menu: a pressed sign draws its hook, then the page changes (the stroke takes a third of a second) */
document.querySelectorAll('.nav .sign[href]').forEach(a => a.addEventListener('click', e => {
  if (!matchMedia('(max-width:820px)').matches || e.metaKey || e.ctrlKey || a.classList.contains('go')) return;
  e.preventDefault(); a.classList.add('go'); setTimeout(() => { location.href = a.href; setTimeout(() => a.classList.remove('go'), 600) }, 340) }));
addEventListener('pageshow', () => document.querySelectorAll('.nav .sign.go').forEach(a => a.classList.remove('go')));

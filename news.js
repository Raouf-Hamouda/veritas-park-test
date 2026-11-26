/* VERITAS, the News page: the reader. The section is tall, its screen holds still; the scroll chooses the news.
   A tick or an arrow scrolls the page to its news, so the scroll bar, the ticks and the news always tell the same thing.
   On a phone (820 px and under) nothing is done here: the news follow each other down the page. */
(() => {
  const sec = document.querySelector('.nr'); if (!sec) return;
  const arts = [...sec.querySelectorAll('.nr-list article')], ticks = [...sec.querySelectorAll('.nr-rule button')], n = arts.length;
  const wide = matchMedia('(min-width:821px)'); let cur = -1;
  // a picture is asked for only when its news is the one shown or the next one
  const need = k => { const im = arts[k] && arts[k].querySelector('img[data-src]'); if (im) { im.src = im.dataset.src; im.removeAttribute('data-src') } };
  const all = () => arts.forEach((a, k) => { const im = a.querySelector('img[data-src]'); if (im) im.loading = 'lazy'; need(k); a.classList.add('on') });
  const show = i => { if (i === cur) return; cur = i; need(i); need(i + 1); need(i - 1);
    arts.forEach((a, k) => { a.classList.toggle('on', k === i); a.inert = wide.matches && k !== i });
    ticks.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-current', k === i) });
    sec.style.setProperty('--i', i) };
  const span = () => Math.max(1, sec.offsetHeight - innerHeight);
  const read = () => { if (!wide.matches) return; const p = -sec.getBoundingClientRect().top / span(); show(Math.min(n - 1, Math.max(0, Math.floor(p * n)))) };
  const go = i => { i = Math.min(n - 1, Math.max(0, i)); scrollTo({ top: scrollY + sec.getBoundingClientRect().top + (i + .5) / n * span(), behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }) };
  ticks.forEach((t, k) => t.addEventListener('click', () => go(k)));
  sec.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => go(cur + +b.dataset.move)));
  sec.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); else if (e.key === 'ArrowLeft') go(cur - 1) });
  addEventListener('scroll', read, { passive: true }); addEventListener('resize', read);
  wide.addEventListener('change', () => { cur = -1; arts.forEach(a => a.inert = false); wide.matches ? read() : all() });
  wide.matches ? (show(0), read()) : all();
})();

/* VERITAS, scripts that wait. The 3D engine, the map and the model weigh about 800 K: a page asks for them only when one of its 3D blocks comes near the screen
   (or at once when the address points at a floor plan). The page names the blocks in data-near and the scripts, in their order, in data-load. */
(() => {
  const me = document.currentScript, list = me.dataset.load.split(','), near = document.querySelectorAll(me.dataset.near); let done = false;
  const go = () => { if (done) return; done = true; for (const src of list) { const s = document.createElement('script'); s.src = src; s.async = false; document.body.append(s) } };   // async = false: they run in the order written
  if (!near.length) return; if (!('IntersectionObserver' in window) || /^#floor-/.test(location.hash)) return go();
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go() } }, { rootMargin: '250% 0px' }); near.forEach(n => io.observe(n));
})();

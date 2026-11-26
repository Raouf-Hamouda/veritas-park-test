/* VERITAS, the map of the region (the live home page showed a Google map here). Our own map: the open map of OpenStreetMap (tiles by OpenFreeMap, free, no key),
   drawn again in the colours of the page: the ground in the page's pastel, the water in its muted hue, roads and rails as thin black lines, no shops or icons.
   The round logo stands on the clock tower. Two thin lines join it to Berlin and Hamburg, with the distance as the crow flies: "right in the middle".
   A computer: drag at once, the wheel zooms once the map has been clicked. A phone: the page scrolls over the map; a tap enters it, the cross leaves it (as the 3D model). */
(() => {
  const box = document.querySelector('.vmap'); if (!box) return;
  const V = [11.76847, 52.99112], BER = [13.4050, 52.5200], HAM = [9.9937, 53.5511];   // the clock tower (OpenStreetMap), Berlin, Hamburg
  const css = getComputedStyle(box), col = n => css.getPropertyValue(n).trim();
  const ground = col('--h-pastel') || '#FDE8E8', water = col('--h-muted') || '#9A6464', ink = '#000', phone = matchMedia('(pointer:coarse)').matches;
  let map = null;
  const start = () => {
    if (map || !window.maplibregl) return;
    fetch('https://tiles.openfreemap.org/styles/positron').then(r => r.json()).then(style => {
      style.layers = style.layers.filter(l => !/poi|airport|shield|aeroway|label_other|ice|glacier|ne2/.test(l.id) && l.source !== 'ne2_shaded');
      for (const l of style.layers) { const p = l.paint = l.paint || {}, id = l.id;
        if (l.type === 'background') p['background-color'] = ground;
        else if (l.type === 'fill') { p['fill-color'] = /water/.test(id) ? water : /building/.test(id) ? 'rgba(0,0,0,.16)' : /wood|park/.test(id) ? 'rgba(0,0,0,.05)' : 'rgba(0,0,0,.03)'; p['fill-outline-color'] = 'rgba(0,0,0,0)'; }
        else if (l.type === 'line') { if (/waterway/.test(id)) p['line-color'] = water; else if (/boundary/.test(id)) { p['line-color'] = 'rgba(0,0,0,.35)'; p['line-dasharray'] = [2, 3] } else if (/casing/.test(id)) p['line-color'] = 'rgba(0,0,0,0)'; else if (/rail/.test(id)) p['line-color'] = 'rgba(0,0,0,.55)'; else p['line-color'] = /motorway|major/.test(id) ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.28)'; }
        else if (l.type === 'symbol') { p['text-color'] = /water/.test(id) ? water : ink; p['text-halo-color'] = ground; p['text-halo-width'] = 1.6; if (l.layout) l.layout['text-letter-spacing'] = /city|country|state/.test(id) ? .12 : .02; if (/city|country/.test(id) && l.layout) l.layout['text-transform'] = 'uppercase' } }
      map = new maplibregl.Map({ container: box.querySelector('.vmap-c'), style, bounds: [[HAM[0] - .3, BER[1] - .25], [BER[0] + .3, HAM[1] + .2]], fitBoundsOptions: { padding: 40 },
        attributionControl: false, scrollZoom: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, dragPan: !phone, touchZoomRotate: !phone, cooperativeGestures: false, maxZoom: 18, minZoom: 5 });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>' }), 'bottom-left');
      map.on('load', () => {
        const line = (to) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: [V, to] } }), pt = (c, name, km) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: { name, km } });
        map.addSource('links', { type: 'geojson', data: { type: 'FeatureCollection', features: [line(BER), line(HAM)] } });
        map.addLayer({ id: 'links', type: 'line', source: 'links', paint: { 'line-color': ink, 'line-width': 1.4, 'line-dasharray': [3, 3], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 1, 11, 0] } });
        map.addSource('ends', { type: 'geojson', data: { type: 'FeatureCollection', features: [pt(BER, 'Berlin', '122 km'), pt(HAM, 'Hamburg', '133 km')] } });
        map.addLayer({ id: 'ends', type: 'circle', source: 'ends', paint: { 'circle-radius': 5, 'circle-color': ink, 'circle-opacity': ['interpolate', ['linear'], ['zoom'], 9, 1, 11, 0] } });
        box.classList.add('ready');
      });
      // the logo on the tower, and the distance labels half way along each line
      const el = document.createElement('button'); el.type = 'button'; el.className = 'vmap-pin'; el.setAttribute('aria-label', 'VERITAS'); el.innerHTML = '<i class="mk"></i>';
      el.addEventListener('click', e => { e.stopPropagation(); fly(true) });
      new maplibregl.Marker({ element: el }).setLngLat(V).addTo(map);
      for (const [c, km] of [[BER, '122 km'], [HAM, '133 km']]) { const k = document.createElement('span'); k.className = 'vmap-km'; k.textContent = km; new maplibregl.Marker({ element: k }).setLngLat([(V[0] + c[0]) / 2, (V[1] + c[1]) / 2]).addTo(map); map.on('zoom', () => k.style.opacity = map.getZoom() > 9 ? 0 : 1) }
      // a click lets the wheel zoom (a computer); leaving the map gives the wheel back to the page
      box.addEventListener('click', () => { if (!phone) map.scrollZoom.enable() }); box.addEventListener('mouseleave', () => map.scrollZoom.disable());
    });
  };
  const fly = site => map && (site ? map.flyTo({ center: V, zoom: 15.6, speed: 1.1, curve: 1.5 }) : map.fitBounds([[HAM[0] - .3, BER[1] - .25], [BER[0] + .3, HAM[1] + .2]], { padding: 40, speed: 1.1 }));
  box.querySelectorAll('[data-map]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const a = b.dataset.map; if (!map) return;
    if (a === 'in') map.zoomIn(); else if (a === 'out') map.zoomOut(); else if (a === 'site') fly(true); else if (a === 'region') fly(false);
    else if (a === 'leave') { box.classList.remove('live'); map.dragPan.disable(); map.touchZoomRotate.disable() } }));
  if (phone) box.querySelector('.vmap-c').addEventListener('click', () => { if (!map || box.classList.contains('live')) return; box.classList.add('live'); map.dragPan.enable(); map.touchZoomRotate.enable(); map.touchZoomRotate.disableRotation() });
  // the map library (800 K) and the map are asked for only when the block comes near
  new IntersectionObserver((es, io) => { if (!es[0].isIntersecting) return; io.disconnect();
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'lib/maplibre-gl.css'; document.head.append(l);
    const s = document.createElement('script'); s.src = 'lib/maplibre-gl.js'; s.onload = start; document.body.append(s) }, { rootMargin: '150% 0px' }).observe(box);
})();

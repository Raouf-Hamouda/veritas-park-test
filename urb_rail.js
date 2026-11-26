/* VERITAS, the 3D model: the railway. The tracks of the map (the line Berlin - Hamburg passes the factory) get their bed of ballast,
   their two rails and their sleepers; where a track crosses the water it runs between the girders of a bridge. No train. */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, MAP, town, pairs } = api, waters = api.boxed(api.waters);
  const bedMat = new T.MeshLambertMaterial({ color: '#D9D4CA' }), steel = new T.MeshLambertMaterial({ color: '#6F6A66' }), timber = new T.MeshLambertMaterial({ color: '#9C9082' }), girder = new T.MeshLambertMaterial({ color: '#8C8782' });
  const beds = [], rails = [], sleepers = [], girders = [];
  for (const flat of MAP.rails) for (const line of api.clip(pairs(flat))) {
    if (api.length(line) < 14) continue;
    api.pieces(line, (x, y, len, a) => {
      beds.push({ x, y: .3, z: -y, sx: len + .5, sy: .3, sz: 3.4, ry: a });
      for (const side of [-.72, .72]) rails.push({ x: x - Math.sin(a) * side, y: .66, z: -(y + Math.cos(a) * side), sx: len + .2, sy: .14, sz: .1, ry: a });
    });
    api.along(line, 1.9, (x, y, a) => sleepers.push({ x, y: .52, z: -y, sx: .28, sy: .12, sz: 2.5, ry: a }));
    api.along(line, 6, (x, y, a) => { if (!api.hit(waters, x, y)) return; for (const side of [-2.4, 2.4]) girders.push({ x: x - Math.sin(a) * side, y: 1.9, z: -(y + Math.cos(a) * side), sx: 6.2, sy: 3, sz: .3, ry: a }) });
  }
  api.instances(api.box, bedMat, beds, town, false); api.instances(api.box, timber, sleepers, town, false); api.instances(api.box, steel, rails, town, false); api.instances(api.box, girder, girders, town);
});

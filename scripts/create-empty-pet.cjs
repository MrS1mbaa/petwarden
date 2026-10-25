const fs = require('node:fs');
const fixed = k => ({ a: 0, k });
const ellipse = (name, x, y, w, h, color) => ({ ty: 'gr', nm: name, it: [
  { ty: 'el', p: fixed([x, y]), s: fixed([w, h]), d: 1, nm: name },
  { ty: 'fl', c: fixed(color), o: fixed(100), r: 1, nm: 'Fill' },
  { ty: 'tr', p: fixed([0, 0]), a: fixed([0, 0]), s: fixed([100, 100]), r: fixed(0), o: fixed(100), sk: fixed(0), sa: fixed(0) },
] });
const rotation = (from, to) => ({ a: 1, k: [
  { t: 0, s: [from], e: [to], i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] } },
  { t: 30, s: [to], e: [from], i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] } },
  { t: 60, s: [from] },
] });
const layer = (ind, name, shapes, anchor, position, r) => ({ ddd: 0, ind, ty: 4, nm: name, sr: 1, ks: { o: fixed(100), r, p: fixed(position), a: fixed(anchor), s: fixed([100, 100, 100]) }, shapes, ip: 0, op: 60, st: 0, bm: 0 });
const tan = [0.83, 0.54, 0.30, 1], cream = [0.97, 0.93, 0.85, 1], ink = [0.12, 0.12, 0.12, 1], green = [0.17, 0.50, 0.35, 1];
const animation = { v: '5.7.4', fr: 30, ip: 0, op: 60, w: 180, h: 180, nm: 'PetWarden — original empty pet', ddd: 0, assets: [], layers: [
  layer(1, 'Friendly head tilt', [ellipse('Eye left', 73, 72, 7, 9, ink), ellipse('Eye right', 107, 72, 7, 9, ink), ellipse('Nose', 90, 89, 14, 10, ink), ellipse('Muzzle', 90, 87, 37, 29, cream), ellipse('Face', 90, 72, 64, 63, tan), ellipse('Ear left', 55, 76, 25, 55, tan), ellipse('Ear right', 125, 76, 25, 55, tan)], [90, 92, 0], [90, 92, 0], rotation(-4, 4)),
  layer(2, 'Soft bandana', [ellipse('Bandana', 90, 106, 49, 18, green)], [0, 0, 0], [0, 0, 0], fixed(0)),
  layer(3, 'Seated body', [ellipse('Paw left', 72, 151, 25, 17, cream), ellipse('Paw right', 109, 151, 25, 17, cream), ellipse('Chest', 90, 132, 31, 46, cream), ellipse('Body', 90, 131, 59, 55, tan)], [0, 0, 0], [0, 0, 0], fixed(0)),
  layer(4, 'Tail wag', [ellipse('Tail', 139, 131, 19, 45, tan)], [128, 148, 0], [128, 148, 0], rotation(-12, 12)),
] };
fs.writeFileSync('assets/lottie/empty-pet.json', JSON.stringify(animation));

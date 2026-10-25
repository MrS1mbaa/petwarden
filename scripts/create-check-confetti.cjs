// Generates assets/lottie/check-confetti.json: eight small rounded pieces that burst out of the check
// circle and fade. Hand-written geometry, no third-party artwork. Usage: node scripts/create-check-confetti.cjs
const fs = require('node:fs');
const path = require('node:path');

const fixed = k => ({ a: 0, k });
const ease = { i: { x: 0.65, y: 1 }, o: { x: 0.2, y: 0 } };
const green = [0.208, 0.725, 0.518, 1], orange = [0.949, 0.631, 0.239, 1];
const centre = 48, distance = 37, end = 34;

const piece = index => {
  const angle = (index * Math.PI) / 4;
  const target = [centre + distance * Math.cos(angle), centre + distance * Math.sin(angle), 0];
  return {
    ddd: 0, ind: index + 1, ty: 4, nm: 'Care confetti', sr: 1,
    ks: {
      o: { a: 1, k: [{ t: 0, s: [0], e: [100], ...ease }, { t: 4, s: [100], e: [0], ...ease }, { t: end, s: [0] }] },
      r: fixed(index * 32),
      p: { a: 1, k: [{ t: 0, s: [centre, centre, 0], e: target, ...ease }, { t: end, s: target }] },
      a: fixed([0, 0, 0]), s: fixed([100, 100, 100]),
    },
    shapes: [
      { ty: 'rc', d: 1, s: fixed([4, 7]), p: fixed([0, 0]), r: fixed(2) },
      { ty: 'fl', c: fixed(index % 2 ? orange : green), o: fixed(100), r: 1 },
    ],
    ip: 0, op: 36, st: 0, bm: 0,
  };
};

const animation = { v: '5.7.4', fr: 60, ip: 0, op: 36, w: 96, h: 96, nm: 'PetWarden — original check confetti', ddd: 0, assets: [], layers: Array.from({ length: 8 }, (_, index) => piece(index)) };
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'lottie', 'check-confetti.json'), JSON.stringify(animation));

const { copyFileSync, mkdirSync } = require('node:fs');
mkdirSync('public', { recursive: true });
copyFileSync('node_modules/canvaskit-wasm/bin/full/canvaskit.wasm', 'public/canvaskit.wasm');

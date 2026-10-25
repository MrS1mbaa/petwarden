// Builds licenses/npm.json: the license text of every npm package the app depends on,
// kept in the repo as the notices required by MIT/BSD/Apache.
// Usage: node scripts/generate-licenses.cjs          (write the file)
//        node scripts/generate-licenses.cjs --check  (fail if the committed file is stale)
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'licenses', 'npm.json');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const NOTICE = /^(licen[cs]e|copying|notice)(\.|-|$)/i;

function collect() {
  const texts = [], index = new Map(), packages = [];
  const textId = text => {
    const clean = text.replace(/\r\n?/g, '\n').trim();
    if (!index.has(clean)) { index.set(clean, texts.length); texts.push(clean); }
    return index.get(clean);
  };
  // Some packages publish no license file. Their notice is then the standard text of the license they
  // declare, with the holder from package.json (or Meta for the React Native / Metro monorepos).
  const holder = (meta) => {
    const author = typeof meta.author === 'string' ? meta.author : meta.author?.name;
    if (author) return author.replace(/\s*[<(].*$/, '');
    const repo = typeof meta.repository === 'string' ? meta.repository : meta.repository?.url ?? '';
    return /github\.com[/:](react|facebook)\//.test(repo) ? 'Meta Platforms, Inc. and affiliates.' : `the ${meta.name} authors`;
  };
  const standard = (license, meta, apache) => {
    if (/Apache-2\.0/.test(license) && apache !== undefined) return apache;
    if (/^\(?MIT\b/.test(license)) return `MIT License\n\nCopyright (c) ${holder(meta)}\n\n${MIT}`;
    if (/BSD-3-Clause/.test(license)) return `BSD 3-Clause License\n\nCopyright (c) ${holder(meta)}\n\n${BSD3}`;
    if (/Unlicense/.test(license)) return UNLICENSE;
    throw new Error(`${meta.name}: no license file and no standard text for "${license}"`);
  };
  const pending = [];
  for (const [location, entry] of Object.entries(lock.packages)) {
    // Skip the app itself, dev-only tools and per-platform build binaries (they differ by OS and never ship).
    if (!location || entry.dev || entry.devOptional || entry.os || entry.cpu || entry.link) continue;
    const dir = path.join(root, location);
    if (!fs.existsSync(path.join(dir, 'package.json'))) continue;
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const files = fs.readdirSync(dir).filter(name => NOTICE.test(name) && fs.statSync(path.join(dir, name)).isFile()).sort();
    const license = typeof meta.license === 'string' ? meta.license : (meta.licenses ?? []).map(item => item.type ?? item).join(' OR ') || 'UNKNOWN';
    const item = { name: meta.name, version: meta.version, license, texts: files.map(name => textId(fs.readFileSync(path.join(dir, name), 'utf8'))) };
    if (!files.length) { item.standardText = true; pending.push([item, meta]); }
    packages.push(item);
  }
  const apache = texts.findIndex(text => /^Apache License\s+Version 2\.0, January 2004/.test(text));
  for (const [item, meta] of pending) {
    const text = standard(item.license, meta, apache === -1 ? undefined : texts[apache]);
    item.texts = [textId(text)];
  }
  // Native code compiled into the APK whose npm package does not carry the upstream notice
  // (scripts/licenses/skia-LICENSE.txt is skia.googlesource.com/skia/+/main/LICENSE, verbatim).
  packages.push({ name: 'Skia (native graphics library, inside @shopify/react-native-skia)', version: 'bundled', license: 'BSD-3-Clause', texts: [textId(fs.readFileSync(path.join(__dirname, 'licenses', 'skia-LICENSE.txt'), 'utf8'))] });
  // One entry per name+version (npm can install the same version in several places).
  const unique = [...new Map(packages.map(item => [`${item.name}@${item.version}`, item])).values()]
    .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
  return JSON.stringify({ packages: unique, texts }) + '\n';
}

const MIT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
const BSD3 = `Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;
const UNLICENSE = `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

For more information, please refer to <https://unlicense.org>`;

const next = collect();
if (process.argv.includes('--check')) {
  // Normalise line endings: Windows checkouts (core.autocrlf) turn the committed LF file into CRLF.
  const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current !== next) { console.error('licenses/npm.json is out of date. Run: node scripts/generate-licenses.cjs'); process.exit(1); }
  console.log('licenses/npm.json is up to date');
} else {
  fs.writeFileSync(out, next);
  const data = JSON.parse(next);
  console.log(`wrote ${data.packages.length} packages, ${data.texts.length} unique texts, ${(next.length / 1024).toFixed(0)} KB`);
}

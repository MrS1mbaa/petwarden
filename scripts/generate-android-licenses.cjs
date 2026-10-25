// Builds licenses/android.json: every Java/Kotlin library inside the release APK
// (AndroidX, Kotlin, Firebase, Fresco, ...) with the license its Maven POM declares.
// Needs a generated android/ folder (run a build first) and the Gradle cache it filled.
// Usage: node scripts/generate-android-licenses.cjs
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const android = path.join(root, 'android');
const cache = path.join(process.env.GRADLE_USER_HOME || path.join(os.homedir(), '.gradle'), 'caches', 'modules-2', 'files-2.1');
const gradlew = path.join(android, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
if (!fs.existsSync(gradlew)) { console.error('android/ is missing. Build the APK once, then rerun.'); process.exit(1); }

// Run by relative name from android/: cmd.exe cannot start a quoted path that contains a space.
const tree = execFileSync(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', [':app:dependencies', '--configuration', 'releaseRuntimeClasspath', '-q'],
  { cwd: android, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 64 * 1024 * 1024 });

// "+--- group:artifact:1.0 -> 1.2 (*)" -> group:artifact:1.2 (the version Gradle actually resolved)
const coordinates = new Set();
for (const line of tree.split(/\r?\n/)) {
  const match = line.match(/--- ([\w.-]+):([\w.-]+):([\w.+-]+)(?: -> ([\w.+-]+))?/);
  if (match) coordinates.add(`${match[1]}:${match[2]}:${match[4] ?? match[3]}`);
}

function pom(group, artifact, version) {
  const dir = path.join(cache, group, artifact, version);
  if (!fs.existsSync(dir)) return null;
  for (const hash of fs.readdirSync(dir)) {
    const file = path.join(dir, hash, `${artifact}-${version}.pom`);
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  }
  return null;
}
const tag = (xml, name) => xml.match(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`))?.[1];
// A POM without <licenses> inherits them from its <parent> POM.
function licenses(group, artifact, version, depth = 0) {
  const xml = pom(group, artifact, version);
  if (!xml) return [];
  const block = xml.match(/<licenses>([\s\S]*?)<\/licenses>/)?.[1];
  if (block) return [...block.matchAll(/<license>([\s\S]*?)<\/license>/g)].map(([, item]) => ({ name: tag(item, 'name') ?? 'UNKNOWN', url: tag(item, 'url') ?? '' }));
  const parent = xml.match(/<parent>([\s\S]*?)<\/parent>/)?.[1];
  if (!parent || depth > 4) return [];
  return licenses(tag(parent, 'groupId'), tag(parent, 'artifactId'), tag(parent, 'version'), depth + 1);
}

// Exact upstream LICENSE files (scripts/licenses/android, fetched from each project's repo at the
// shipped version) for the non-Apache libraries, whose notices name a specific copyright holder.
const UPSTREAM = [
  ['com.facebook.fresco:', 'fresco'], ['com.facebook.infer.annotation:', 'infer'], ['com.facebook.yoga:', 'yoga'],
  ['com.parse.bolts:', 'bolts'], ['androidx.datastore:datastore-preferences-external-protobuf', 'protobuf'],
  ['io.github.lukmccall.pika:', 'pika'], ['org.aomedia.avif.android:', 'libavif'], ['org.brotli:', 'brotli'],
  ['org.checkerframework:checker-compat-qual', 'checker-qual'], ['org.codehaus.mojo:animal-sniffer-annotations', 'animal-sniffer'],
];
const texts = [], textIndex = new Map();
function upstream(name) {
  const file = UPSTREAM.find(([prefix]) => name.startsWith(prefix))?.[1];
  if (!file) return undefined;
  if (!textIndex.has(file)) { textIndex.set(file, texts.length); texts.push(fs.readFileSync(path.join(__dirname, 'licenses', 'android', `${file}.txt`), 'utf8').replace(/\r\n?/g, '\n').trim()); }
  return textIndex.get(file);
}

const libraries = [...coordinates].sort().flatMap(coordinate => {
  const [group, artifact, version] = coordinate.split(':');
  const declared = licenses(group, artifact, version);
  // No POM in the Gradle cache = a module Gradle built from node_modules (Expo modules, React Native).
  // Those are covered by their npm entry in licenses/npm.json.
  if (!declared.length) return [];
  const name = `${group}:${artifact}`, text = upstream(name);
  return [{ name, version, licenses: declared, ...(text === undefined ? {} : { text }) }];
});
const unmapped = libraries.filter(item => item.text === undefined && !item.licenses.some(license => /apache/i.test(license.name) || /Android Software Development Kit/.test(license.name)));
if (unmapped.length) { console.error('No notice text for:', unmapped.map(item => item.name).join(', ')); process.exit(1); }
fs.writeFileSync(path.join(root, 'licenses', 'android.json'), JSON.stringify({ libraries, texts }) + '\n');
console.log(`wrote ${libraries.length} Android libraries, ${texts.length} upstream notice texts`);

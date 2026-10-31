import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const fail = message => { throw new Error(message); };
const mode = process.argv[2] || 'check';
const [major, minor] = process.versions.node.split('.').map(Number);
if (!((major === 22 && minor >= 12) || major === 24)) fail('Use Node 22.12+ or Node 24, matching package.json.');
if (!['check', 'android-debug', 'android-release'].includes(mode)) fail(`Unknown mobile command: ${mode}`);
const appId = read('capacitor.config.ts').match(/appId:\s*['"]([^'"]+)['"]/)?.[1];
if (!appId) fail('Set appId in capacitor.config.ts.');
for (const path of ['android/app/build.gradle', 'ios/App/App.xcodeproj/project.pbxproj']) {
  const text = read(path);
  if (!text.includes(appId)) fail(`Keep the app identifier consistent in capacitor.config.ts and ${path}.`);
}
if (!read('src/app/core/api.config.ts').includes('https://')) fail('Configure an HTTPS API for native builds.');
console.log(`Mobile configuration checked: Android and iOS, app ID ${appId}.`);
if (mode === 'check') process.exit(0);
if (mode === 'android-release') {
  if (appId === 'dev.collegeconnect.preview') fail('Choose your owned production app ID in Capacitor, Android applicationId, and iOS PRODUCT_BUNDLE_IDENTIFIER before a signed release.');
  const signing = resolve(root, 'android/keystore.properties');
  if (!existsSync(signing)) fail('Create android/keystore.properties from its example and configure your private upload key.');
  const properties = readFileSync(signing, 'utf8');
  for (const key of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']) {
    if (!new RegExp(`^\\s*${key}\\s*=\\s*\\S+`, 'm').test(properties)) fail(`Missing ${key} in android/keystore.properties.`);
  }
}
const run = (file, args, cwd = root) => {
  const result = spawnSync(file, args, { cwd, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run(process.execPath, [resolve(root, 'node_modules/@angular/cli/bin/ng.js'), 'build', '--configuration', 'production,mobile']);
run(process.execPath, [resolve(root, 'node_modules/@capacitor/cli/bin/capacitor'), 'sync', 'android']);
const task = mode === 'android-release' ? 'bundleRelease' : 'assembleDebug';
if (process.platform === 'win32') {
  run(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'gradlew.bat', task, '--no-daemon'], resolve(root, 'android'));
} else {
  run('sh', ['gradlew', task, '--no-daemon'], resolve(root, 'android'));
}

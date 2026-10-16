// Builds dist/shrinkwatch-chrome.zip and dist/shrinkwatch-firefox.zip
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const pkg = require('../package.json');
const { ADAPTERS, matchPatterns } = require('../src/adapters.js');

const root = path.join(__dirname, '..');
const matches = [...new Set(ADAPTERS.filter(a => a.core).flatMap(matchPatterns))];
const optional = [...new Set(ADAPTERS.filter(a => !a.core).flatMap(matchPatterns))];
const scripts = ['src/units.js', 'src/history.js', 'src/extract.js', 'src/adapters.js', 'src/listings.js', 'src/content.js'];

function manifest(target) {
  const m = {
    manifest_version: 3,
    name: 'ShrinkWatch EU',
    version: pkg.version,
    description: 'Shows price per kg/l on supermarket web shops and warns when a pack gets smaller for the same price.',
    icons: { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' },
    permissions: ['storage', 'scripting', 'activeTab'],
    host_permissions: matches,
    optional_host_permissions: optional,
    content_scripts: [{ matches, js: scripts, css: ['src/badge.css'], run_at: 'document_idle' }],
    background: target === 'firefox' ? { scripts: ['src/adapters.js', 'src/background.js'] } : { service_worker: 'src/background.js' },
    action: { default_title: 'ShrinkWatch EU', default_popup: 'src/popup.html' }
  };
  if (target === 'firefox') {
    m.browser_specific_settings = { gecko: { id: 'shrinkwatch-eu@emirmrkaljevic.github.io', strict_min_version: '140.0', data_collection_permissions: { required: ['none'] } }, gecko_android: { strict_min_version: '142.0' } };
  }
  return m;
}

const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
for (const target of ['chrome', 'firefox']) {
  const dir = path.join(dist, target);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.cpSync(path.join(root, 'icons'), path.join(dir, 'icons'), { recursive: true });
  for (const f of fs.readdirSync(path.join(root, 'src'))) fs.copyFileSync(path.join(root, 'src', f), path.join(dir, 'src', f));
  fs.copyFileSync(path.join(root, 'LICENSE'), path.join(dir, 'LICENSE'));
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest(target), null, 2));
  execFileSync('python3', ['-c', 'import shutil,sys; shutil.make_archive(sys.argv[1], "zip", sys.argv[2])', path.join(dist, `shrinkwatch-${target}-${pkg.version}`), dir]);
  console.log(`built dist/shrinkwatch-${target}-${pkg.version}.zip`);
}

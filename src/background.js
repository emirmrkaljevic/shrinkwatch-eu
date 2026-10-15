// Registers content scripts for optional shops the user has enabled.
// Re-registers on every start because Firefox does not persist dynamic scripts across sessions.
const SCRIPTS = ['src/units.js', 'src/history.js', 'src/extract.js', 'src/adapters.js', 'src/listings.js', 'src/content.js'];
const ID = 'optional-shops';

async function grantedOptionalPatterns() {
  const { origins = [] } = await chrome.permissions.getAll();
  const optional = chrome.runtime.getManifest().optional_host_permissions || [];
  return origins.filter(o => optional.includes(o));
}

async function sync() {
  const matches = await grantedOptionalPatterns();
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [ID] });
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [ID] });
  if (!matches.length) return;
  await chrome.scripting.registerContentScripts([{ id: ID, matches, js: SCRIPTS, css: ['src/badge.css'], runAt: 'document_idle' }]);
}

chrome.runtime.onInstalled.addListener(sync);
chrome.runtime.onStartup.addListener(sync);
chrome.permissions.onAdded.addListener(sync);
chrome.permissions.onRemoved.addListener(sync);
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'sync') { sync().then(() => reply(true)); return true; }
});

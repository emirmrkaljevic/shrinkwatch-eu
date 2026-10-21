// Registers one content script for the optional shops the user has enabled.
// Re-syncs on every start because Firefox does not persist dynamic scripts across sessions.
const SCRIPTS = ['src/units.js', 'src/history.js', 'src/extract.js', 'src/adapters.js', 'src/listings.js', 'src/nav.js', 'src/content.js'];
const ID = 'optional-shops';

// Chrome runs this as a service worker and loads the shop list here; Firefox lists adapters.js before this file.
if (typeof importScripts === 'function' && !(globalThis.SW && globalThis.SW.grantedPatterns)) importScripts('adapters.js');

async function grantedOptionalPatterns() {
  const { origins = [] } = await chrome.permissions.getAll();
  const optional = chrome.runtime.getManifest().optional_host_permissions || [];
  return globalThis.SW.grantedPatterns(optional, origins);
}

async function registered() {
  const all = await chrome.scripting.getRegisteredContentScripts();
  return all.some(s => s.id === ID);
}

const missing = e => /nonexistent script id/i.test(String(e && e.message));
const duplicate = e => /duplicate script id/i.test(String(e && e.message));

async function syncNow() {
  const matches = await grantedOptionalPatterns();
  const exists = await registered();
  if (!matches.length) {
    if (exists) await chrome.scripting.unregisterContentScripts({ ids: [ID] }).catch(e => { if (!missing(e)) throw e; });
    return [];
  }
  const script = { id: ID, matches, js: SCRIPTS, css: ['src/badge.css'], runAt: 'document_idle' };
  if (exists) {
    await chrome.scripting.updateContentScripts([script]).catch(async e => {
      if (!missing(e)) throw e;
      await chrome.scripting.registerContentScripts([script]); // removed in the meantime by another browser window
    });
  } else {
    await chrome.scripting.registerContentScripts([script]).catch(async e => {
      if (!duplicate(e)) throw e;
      await chrome.scripting.updateContentScripts([script]);
    });
  }
  return matches;
}

// One sync at a time: onInstalled, onStartup, permissions.onAdded/onRemoved and the popup's message
// often fire together, and overlapping register/unregister calls failed with
// "Duplicate script ID" / "Nonexistent script ID" and could leave no script registered.
let queue = Promise.resolve();
function sync() {
  const run = queue.then(syncNow);
  queue = run.catch(e => console.warn('ShrinkWatch: content script sync failed', e));
  return run;
}

const resync = () => { sync().catch(() => {}); };
chrome.runtime.onInstalled.addListener(resync);
chrome.runtime.onStartup.addListener(resync);
chrome.permissions.onAdded.addListener(resync);
chrome.permissions.onRemoved.addListener(resync);
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg) return;
  if (msg.type === 'sync') {
    sync().then(matches => reply({ ok: true, matches }), e => reply({ ok: false, error: String(e && e.message) }));
    return true;
  }
  // Content scripts ask before showing anything on an opt-in shop, so a page opened while access was being
  // removed (or a stale registration) never shows a badge without the permission.
  if (msg.type === 'allowed' && sender && sender.url) {
    let host;
    try { host = new URL(sender.url).hostname; } catch (e) { reply(false); return; }
    const origins = globalThis.SW.originsForHost(globalThis.SW.adapterFor(host), host);
    if (!origins.length) { reply(false); return; }
    chrome.permissions.contains({ origins }).then(reply, () => reply(false));
    return true;
  }
});
// The worker also starts for events after being idle; a sync here is cheap and keeps the registration right.
resync();

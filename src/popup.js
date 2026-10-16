const store = chrome.storage.local;
const SCRIPTS = ['src/units.js', 'src/history.js', 'src/extract.js', 'src/adapters.js', 'src/listings.js', 'src/content.js'];

async function refresh() {
  const all = await store.get(null);
  const n = Object.keys(all).filter(k => k.startsWith('p:')).length;
  document.getElementById('count').textContent = `Products remembered: ${n}`;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function applyState(state) {
  document.getElementById('site').textContent = state.siteText;
  document.getElementById('enable').hidden = !state.showEnable;
  document.getElementById('disable').hidden = !state.showDisable;
  document.getElementById('check').hidden = !state.showCheck;
}

async function setup() {
  const tab = await currentTab();
  const enable = document.getElementById('enable');
  const disable = document.getElementById('disable');
  let url;
  try { url = new URL(tab.url); } catch (e) {
    applyState(globalThis.SW.popupState({ hostname: null, adapter: null, granted: false }));
    return;
  }
  const adapter = globalThis.SW.adapterFor(url.hostname);
  // Only the origins of the shop domain the user is on (kaufland.de, not kaufland.cz and kaufland.sk).
  const origins = globalThis.SW.originsForHost(adapter, url.hostname);
  const granted = origins.length ? await chrome.permissions.contains({ origins }) : false;
  applyState(globalThis.SW.popupState({ hostname: url.hostname, adapter, granted }));

  enable.onclick = async () => {
    // Must run directly in the click handler so the browser shows its permission prompt.
    const ok = await chrome.permissions.request({ origins });
    if (!ok) return;
    await chrome.runtime.sendMessage({ type: 'sync' });
    applyState({
      siteText: `Enabled on ${url.hostname}. Reload the page to see unit prices.`,
      showEnable: false,
      showDisable: true,
      showCheck: false
    });
  };

  disable.onclick = async () => {
    // Remove the origins exactly as the browser granted them (Chrome may report them without the path).
    const { origins: granted = [] } = await chrome.permissions.getAll();
    const toRemove = globalThis.SW.originsToRemove(origins, granted);
    try { await chrome.permissions.remove({ origins: toRemove }); } catch (e) { console.warn('ShrinkWatch: remove failed', e); }
    // Background also syncs on permissions.onRemoved; the message waits until the script is unregistered.
    try { await chrome.runtime.sendMessage({ type: 'sync' }); } catch (e) { /* background restarts and syncs on its own */ }
    const still = await chrome.permissions.contains({ origins });
    // Take the badge off the open page now instead of waiting for a reload (activeTab covers this tab).
    if (!still) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
        const b = document.getElementById('shrinkwatch-badge'); if (b) b.remove();
        for (const el of document.querySelectorAll('.sw-tile-badge, [data-sw-tile]')) { if (el.classList.contains('sw-tile-badge')) el.remove(); else el.removeAttribute('data-sw-tile'); }
      } }).catch(() => {});
    }
    applyState(still
      ? { siteText: `Could not remove access to ${url.hostname}. Remove it under Site access in the browser's extension settings.`, showEnable: false, showDisable: true, showCheck: false }
      : globalThis.SW.popupState({ hostname: url.hostname, adapter, granted: false }));
  };
}

document.getElementById('check').onclick = async () => {
  const tab = await currentTab();
  // activeTab grants temporary access to this tab only, no host permission needed.
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { globalThis.SW_FORCE = true; } });
  await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['src/badge.css'] });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: SCRIPTS });
  window.close();
};
document.getElementById('clear').onclick = async () => { await store.clear(); refresh(); };
setup();
refresh();

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

async function setup() {
  const tab = await currentTab();
  const site = document.getElementById('site');
  const enable = document.getElementById('enable');
  let url;
  try { url = new URL(tab.url); } catch (e) { site.textContent = 'Open a shop product page to use ShrinkWatch.'; return; }
  const adapter = globalThis.SW.adapterFor(url.hostname);
  if (!adapter) { site.textContent = `${url.hostname} is not a known shop. You can still check a page manually.`; return; }
  const origins = globalThis.SW.matchPatterns(adapter);
  const granted = await chrome.permissions.contains({ origins });
  if (adapter.core || granted) { site.textContent = `Active on ${url.hostname}`; return; }
  site.textContent = `${url.hostname} is supported but not enabled yet.`;
  enable.hidden = false;
  enable.onclick = async () => {
    // Must run directly in the click handler so the browser shows its permission prompt.
    const ok = await chrome.permissions.request({ origins });
    if (!ok) return;
    await chrome.runtime.sendMessage({ type: 'sync' });
    site.textContent = `Enabled on ${url.hostname}. Reload the page to see unit prices.`;
    enable.hidden = true;
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

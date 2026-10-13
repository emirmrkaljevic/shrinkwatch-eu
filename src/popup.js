const store = chrome.storage.local;
async function refresh() {
  const all = await store.get(null);
  const n = Object.keys(all).filter(k => k.startsWith('p:')).length;
  document.getElementById('count').textContent = `Products remembered: ${n}`;
}
document.getElementById('clear').onclick = async () => { await store.clear(); refresh(); };
refresh();

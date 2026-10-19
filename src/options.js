const store = chrome.storage.local;
const msg = t => { document.getElementById('msg').textContent = t; };

async function refresh() {
  const all = await store.get(null);
  document.getElementById('count').textContent = `Products remembered: ${Object.keys(all).filter(k => k.startsWith('p:')).length}`;
}

document.getElementById('export').onclick = async () => {
  const data = globalThis.SW.exportData(await store.get(null));
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = `shrinkwatch-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  msg(`Exported ${Object.keys(data.products).length} products.`);
};

document.getElementById('pick').onclick = () => document.getElementById('file').click();
document.getElementById('file').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    const keys = Object.keys((data && data.products) || {});
    const { updates, count } = globalThis.SW.mergeImport(await store.get(keys), data);
    await store.set(updates);
    msg(`Imported ${count} products.`);
  } catch (err) {
    msg(err instanceof SyntaxError ? 'The file is not valid JSON.' : err.message);
  }
  e.target.value = '';
  refresh();
};
refresh();

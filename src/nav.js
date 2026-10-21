// Page-mode decisions and address watching for single-page shops. Pure helpers, no network.
(function (g) {
  const SW = g.SW = g.SW || {};

  // Which parts of the extension apply to this path.
  SW.pageMode = function (adapter, pathname, forced) {
    if (!adapter) return { product: false, listing: false };
    const product = !!forced || !!(adapter.productPath && adapter.productPath.test(pathname));
    return { product, listing: !!adapter.listing };
  };

  // Calls onChange(newPath, oldPath) when the page path changes without a page load
  // (history.pushState, back/forward, or a shop that rewrites the address). Query and hash changes are ignored.
  SW.watchPath = function (getPath, onChange, opts) {
    const o = opts || {};
    const setI = o.setInterval || g.setInterval.bind(g);
    const clearI = o.clearInterval || g.clearInterval.bind(g);
    let last = getPath();
    const check = () => {
      const now = getPath();
      if (now === last) return;
      const prev = last;
      last = now;
      onChange(now, prev);
    };
    const id = setI(check, o.interval || 700);
    const win = o.window;
    if (win && win.addEventListener) win.addEventListener('popstate', check);
    return { check, stop() { clearI(id); if (win && win.removeEventListener) win.removeEventListener('popstate', check); } };
  };
})(globalThis);

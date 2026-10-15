// Pure popup UI state for a given tab hostname / adapter / permission grant.
(function (root) {
  function popupState({ hostname, adapter, granted }) {
    if (!hostname) {
      return {
        siteText: 'Open a shop product page to use ShrinkWatch.',
        showEnable: false,
        showDisable: false,
        showCheck: false
      };
    }
    if (!adapter) {
      return {
        siteText: `${hostname} is not a known shop. You can still check a page manually.`,
        showEnable: false,
        showDisable: false,
        showCheck: true
      };
    }
    if (adapter.core) {
      return {
        siteText: `Active on ${hostname}`,
        showEnable: false,
        showDisable: false,
        showCheck: false
      };
    }
    if (granted) {
      return {
        siteText: `Active on ${hostname}`,
        showEnable: false,
        showDisable: true,
        showCheck: false
      };
    }
    return {
      siteText: `${hostname} is supported but not enabled yet.`,
      showEnable: true,
      showDisable: false,
      showCheck: true
    };
  }

  const api = { popupState };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

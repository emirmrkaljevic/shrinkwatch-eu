# ShrinkWatch EU

[![Latest release](https://img.shields.io/github/v/release/emirmrkaljevic/shrinkwatch-eu)](https://github.com/emirmrkaljevic/shrinkwatch-eu/releases/latest) [![Shops](https://img.shields.io/badge/shops-about%2070-2e7d32)](docs/shops.md) [![Website](https://img.shields.io/badge/website-shrinkwatch--eu-2e7d32)](https://emirmrkaljevic.github.io/shrinkwatch-eu/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

<p align="center"><a href="https://skintoscan.com/#packages"><img src=".github/assets/skintoscan-support.svg" width="684" alt="Support my open-source work: get a SkinToScan pack"></a><br><sub>If you find this useful, you can support me by getting a SkinToScan pack, my other project. It's a one-time purchase that directly funds my open-source work.</sub></p>
<p align="center"><a href="https://skintoscan.com/checkout/?add-to-cart=138"><img src=".github/assets/skintoscan-pack-1.svg" width="220" alt="Buy Single Picture Check, €4.49"></a> <a href="https://skintoscan.com/checkout/?add-to-cart=139"><img src=".github/assets/skintoscan-pack-5.svg" width="220" alt="Buy 5 Picture Pack, €19.99 (popular)"></a> <a href="https://skintoscan.com/checkout/?add-to-cart=140"><img src=".github/assets/skintoscan-pack-15.svg" width="220" alt="Buy 15 Picture Pack, €54.99"></a></p>

A browser extension for Chrome and Firefox that shows the **price per kg / litre / piece** on supermarket web shops in the EU and the Balkans, and warns you about **shrinkflation**: when a pack gets smaller but the price stays the same.

> "Was 500 g for €2.00, now 450 g for €2.00 = **+11.1% per kg**"

![The badge on a fictional demo product: unit price, then a shrinkflation warning](docs/img/demo.gif)

- Works on the product pages you open. No account, no server, no tracking.
- Remembers pack sizes and prices **only in your browser** so it can spot a smaller pack next time.
- Open source (MIT).

## Supported shops

About 70 grocery and drugstore web shops in 25 EU countries plus Serbia and Bosnia and Herzegovina. The full list, with live check results, is in [docs/shops.md](docs/shops.md).

- **Core shops** work right after install: Konzum, Tommy, Mercator, Bingo, Lidl (DE, AT, HR, SI, RS, BA) and Maxi. On Tommy category and search pages the extension also shows unit prices on product tiles; Konzum, Mercator and Maxi already print unit prices there, so only a shrinkflation marker is added when your local history shows a smaller pack.
- **Opt-in shops**: open the shop, click the ShrinkWatch icon and choose "Enable on this shop". The browser asks for access to that shop only.
- **Any other site**: "Check this page now" reads the current page once, without any standing permission.

Every shop first uses the page's own schema.org `Product` data, then Open Graph tags, then a few CSS selectors. If your shop is missing or broken, please open an issue with the product URL.

## Install

**From a release:** download `shrinkwatch-chrome-*.zip` or `shrinkwatch-firefox-*.zip` from [Releases](https://github.com/emirmrkaljevic/shrinkwatch-eu/releases).

- Chrome / Edge / Brave: unzip, open `chrome://extensions`, enable Developer mode, click "Load unpacked" and choose the folder.
- Firefox: open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and pick the zip.

- Edge: same as Chrome, but open `edge://extensions` and turn on "Developer mode" at the bottom left.
- Firefox loads it only until the next restart. A permanent install will come with the Firefox Add-ons listing.

Store listings (Chrome Web Store, Firefox Add-ons) are coming.

## FAQ

**My shop is not listed.** Open a product page and click "Check this page now" in the popup. If that works, please [request the shop](https://github.com/emirmrkaljevic/shrinkwatch-eu/issues/new?template=shop-request.yml) so it can be added.

**The badge shows the wrong size or price.** Please [report it](https://github.com/emirmrkaljevic/shrinkwatch-eu/issues/new?template=wrong-result.yml) with the product link.

**Why does the popup ask for permission on some shops?** Only a few shops are enabled by default. Any other shop is switched on only when you click "Enable on this shop", so the extension never gets access to sites you don't use.

**Does it send my data anywhere?** No. Pack sizes and prices are stored only in your browser.

**Can I move my history to another browser?** Yes. In the popup, click "Back up or restore history" to export it as a JSON file, then import that file in the other browser.

**Is a shrinkflation warning proof?** No. It compares what this browser saw before with what the shop shows now. Shop data can be wrong, so check the pack before drawing conclusions.

## Develop

```sh
npm ci
npm test        # unit tests (pack-size parsing, unit price, shrinkflation detection, real page fixtures)
npm run build   # dist/shrinkwatch-chrome-<version>.zip and dist/shrinkwatch-firefox-<version>.zip
```

Adding a shop: add an entry to `src/adapters.js`, save a product page as a fixture in `test/fixtures/`, and add a test in `test/extract.test.js`.

## How shrinkflation is detected

For each product (keyed by EAN/SKU or URL) the extension keeps a short local history of pack size and price. When you see a product again with a smaller pack and a higher price per unit than before, it shows a warning. A smaller pack that is proportionally cheaper is not flagged.

## Privacy

No data is collected or sent anywhere. See [PRIVACY.md](PRIVACY.md).

## Disclaimer

ShrinkWatch EU is an independent project. It is not affiliated with, endorsed by or sponsored by Konzum, Lidl, Kaufland, Mercator, Bingo, Spar, Tommy, Rewe, Tesco or any other retailer. Shop names are trademarks of their owners and are used only to describe compatibility. Unit prices are computed from the information shown on the page and may be wrong; always check the shop's own label.

## License

MIT

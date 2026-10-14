# ShrinkWatch EU

A browser extension for Chrome and Firefox that shows the **price per kg / litre / piece** on supermarket web shops in the EU and the Balkans, and warns you about **shrinkflation**: when a pack gets smaller but the price stays the same.

> "Was 500 g for €2.00, now 450 g for €2.00 = **+11.1% per kg**"

- Works on the product pages you open. No account, no server, no tracking.
- Remembers pack sizes and prices **only in your browser** so it can spot a smaller pack next time.
- Open source (MIT).

## Supported shops

About 70 grocery and drugstore web shops in 25 EU countries plus Serbia and Bosnia and Herzegovina. The full list, with live check results, is in [docs/shops.md](docs/shops.md).

- **Core shops** work right after install: Konzum, Tommy, Mercator, Bingo, Lidl (DE, AT, HR, SI, RS, BA) and Maxi.
- **Opt-in shops**: open the shop, click the ShrinkWatch icon and choose "Enable on this shop". The browser asks for access to that shop only.
- **Any other site**: "Check this page now" reads the current page once, without any standing permission.

Every shop first uses the page's own schema.org `Product` data, then Open Graph tags, then a few CSS selectors. If your shop is missing or broken, please open an issue with the product URL.

## Install

**From a release:** download `shrinkwatch-chrome-*.zip` or `shrinkwatch-firefox-*.zip` from [Releases](https://github.com/emirmrkaljevic/shrinkwatch-eu/releases).

- Chrome / Edge / Brave: unzip, open `chrome://extensions`, enable Developer mode, click "Load unpacked" and choose the folder.
- Firefox: open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and pick the zip.

Store listings (Chrome Web Store, Firefox Add-ons) are coming.

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

## Support

If this is useful, you can support development via [GitHub Sponsors](https://github.com/sponsors/emirmrkaljevic).

## License

MIT

# Development

How to build and test the extension, add a shop, and how shrinkflation is detected. For what the extension does and how to install it, see the [README](../README.md).

Every shop first uses the page's own schema.org `Product` data, then Open Graph tags, then a few CSS selectors.

## Build and test

```sh
npm ci
npm test        # unit tests (pack-size parsing, unit price, shrinkflation detection, real page fixtures)
npm run build   # dist/shrinkwatch-chrome-<version>.zip and dist/shrinkwatch-firefox-<version>.zip
```

Adding a shop: add an entry to [`src/adapters.js`](../src/adapters.js), save a product page as a fixture in [`test/fixtures/`](../test/fixtures/), and add a test in [`test/extract.test.js`](../test/extract.test.js).

## How shrinkflation is detected

For each product (keyed by EAN/SKU or URL) the extension keeps a short local history of pack size and price. When you see a product again with a smaller pack and a higher price per unit than before, it shows a warning. A smaller pack that is proportionally cheaper is not flagged.

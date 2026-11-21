# uk-web-apps.co.uk (Toffee Apple Web)

The website for Toffee Apple Web / UK Web Apps: https://www.uk-web-apps.co.uk

A static site with no framework. Pages are generated from `src/data.mjs` by a small Node script, and the output in `public/` is committed, so there's nothing to build before deploying.

## Layout

| Path | What |
| --- | --- |
| `public/` | **The website.** Upload the contents of this folder to the web root. |
| `public/assets/css/site.css` | All styles |
| `public/assets/js/site.js` | Mobile menu, portfolio filters, contact form (the site works without it) |
| `public/assets/img/work/` | Project screenshots (WebP, 1280×800) |
| `public/assets/img/og/` | Social share images (1200×630) |
| `public/.htaccess` | HTTPS/www redirects, `index.html` before the old `index.php`, 404 page, caching, compression |
| `src/data.mjs` | All the content: projects, services, FAQs, contact details |
| `src/build.mjs` | Generates every HTML page, `sitemap.xml` and `robots.txt` |
| `src/tools/og-images.cjs` | Regenerates social share images (needs Playwright) |
| `src/art/` | Source SVGs for illustrated project images |

## Pages

- `/` home, `/services/`, `/work/` (portfolio with filters), `/about/`, `/contact/`, `/404.html`
- One page per project under `/work/<slug>/`: TruckFood, Whitfield Electrical, D&J Plumbing and Heating, Van Stock, MapGoals, Tea and Company, Residents’ Documents, File Vault, Missing Child Locator

## Editing

1. Change the content in `src/data.mjs` (or page layouts in `src/build.mjs`).
2. Run `node src/build.mjs` (Node 18+).
3. If you added a project or changed a project image, run `node src/tools/og-images.cjs`.
4. Upload the changed files from `public/`.

To add a project: add an entry to `projects` in `src/data.mjs`, put a 1280×800 WebP screenshot in `public/assets/img/work/`, then build. It appears in the portfolio, footer, sitemap and related-project links automatically.

Preview locally: `php -S localhost:8000 -t public`, then open http://localhost:8000.

## Deploying

Upload the **contents** of `public/` to the site's web root. Leave these existing server files in place:

- `blog/` (WordPress blog, linked from the menu)
- `sendText.php` (the contact form still sends to it, with the same `name`, `phone`, `email` and `message` parameters as before)

The old `index.php`, `css/`, `js/` and `images/` folders can stay; `.htaccess` serves the new `index.html` first and 301-redirects `/index.php` to `/`.

After going live, submit `https://www.uk-web-apps.co.uk/sitemap.xml` in Google Search Console.

## SEO checklist (built in)

- Unique title and meta description on every page, canonical URLs, Open Graph and Twitter cards
- JSON-LD: `ProfessionalService`, `WebSite`, `BreadcrumbList`, `FAQPage`, `Service`, and `WebApplication` / `MobileApplication` / `WebSite` for each project
- `sitemap.xml` with image entries, `robots.txt`
- One `h1` per page, descriptive alt text, width/height on images, lazy loading below the fold
- Semantic HTML, skip link, keyboard-friendly menu, reduced-motion support

## Selling apps with Paddle

Van Stock is sold for £12 through [Paddle](https://www.paddle.com) (Paddle Billing). Paddle is the Merchant of Record: it takes the payment, sends the receipt, handles refunds and works out any VAT, so you don't need to be VAT registered.

### How it works

1. The buyer clicks **Buy Van Stock for £12** on `/work/van-stock/`. Paddle's checkout opens over the page (`public/assets/js/buy.js`).
2. After payment they're sent to `/work/van-stock/thanks/?txn=…`. That page calls `/api/claim.php`, which checks the order with Paddle's API and shows a **Download** button.
3. Paddle also calls `/api/paddle-webhook.php`, which emails the buyer their link, so it still arrives if they close the browser.
4. `/api/download.php?token=…` sends the file from the private folder. Links expire after 30 days and 5 downloads (configurable).

Orders are saved in `private/orders.sqlite`. Needs PHP 8.1+ with `pdo_sqlite` and `curl`, and the host must be able to send mail with PHP `mail()`.

### Setting it up

1. **Paddle account:** sign up at paddle.com. Paddle reviews your website before you can take live payments. It needs to see the product, price, [terms](public/terms/), [refund policy](public/refunds/) and [privacy policy](public/privacy/), which are all on the site.
2. **Test in the sandbox first** (sandbox-vendors.paddle.com, a separate account):
   - **Catalog > Products:** add "Van Stock" with a one-time price of £12.00. Set the tax mode so the price *includes* tax, so buyers pay exactly £12.
   - **Checkout > Checkout settings:** set the default payment link to `https://www.uk-web-apps.co.uk/work/van-stock/`.
   - **Developer tools > Authentication:** create a **client-side token** and an **API key**.
   - **Developer tools > Notifications:** add a destination `https://www.uk-web-apps.co.uk/api/paddle-webhook.php` for the `transaction.completed` event, and copy its secret key.
3. **Website settings** in `src/data.mjs`: put the client-side token in `site.paddle.clientToken` and the price ID (`pri_…`) in the Van Stock `buy.priceId`, then run `node src/build.mjs`. The Buy button appears once both are set. Until then the page shows "Register your interest".
4. **Private folder:** copy `private-example/` to the server as `private/`, **one level above the web root** (next to `public_html`, not inside it). Fill in `private/config.php` with the API key, webhook secret and price ID. Put the file buyers will download in `private/files/` (e.g. `van-stock.zip`). If your host doesn't allow folders outside the web root, put it at `public_html/private/`; `.htaccess` blocks it from the web.
5. **Test a purchase** in the sandbox with Paddle's test card `4242 4242 4242 4242`. Check the download works and the email arrives.
6. **Go live:** repeat step 2 in your live Paddle account. Set `environment: 'production'` with the live client token and live price ID in `src/data.mjs`, and `'production'` with the live API key, webhook secret and price ID in `private/config.php`. Rebuild and upload.

To sell another app, add a `buy` block to its project in `src/data.mjs` and a matching entry under `products` in `private/config.php`.

**Never commit `private/`**: it holds secret keys and customer emails. It's in `.gitignore`.

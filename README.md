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

## Selling apps with Stripe

Van Stock is sold for £12 (one-off) with [Stripe Checkout](https://stripe.com/payments/checkout). Buyers get a personal link to a copy of Van Stock hosted on this site. (Paddle was tried first but doesn't accept domains that also sell services.)

Stripe only processes the payment: **you are the seller**. That means:
- **Receipts:** turn on Stripe's automatic receipts (Settings > Customer emails > Successful payments).
- **Refunds:** done by you in the Stripe dashboard. The buyer's link switches off automatically.
- **VAT:** you're not VAT registered, so no VAT is charged. Sales count towards the £90,000 UK registration threshold.
- **UK only:** to avoid EU VAT rules, checkout requires a billing address, and any payment from outside the UK is **refunded automatically** (`uk_only` in the config).

### How it works

1. The buyer clicks **Buy Van Stock for £12** on `/work/van-stock/`. `public/assets/js/buy.js` asks `/api/checkout.php` to create a Stripe Checkout Session, then sends the buyer to Stripe's payment page. At checkout, buyers tick to accept the terms and ask for immediate supply, which is needed for digital content under UK consumer law.
2. After paying, Stripe sends them to `/work/van-stock/thanks/?session_id=…`. That page calls `/api/claim.php`, which checks the payment with Stripe and shows an **Open Van Stock** button with install steps.
3. Stripe also calls `/api/stripe-webhook.php`, which emails the buyer their personal link, so it still arrives if they close the browser. Refunds made in Stripe (`charge.refunded`) switch off the link.
4. The link is `/apps/van-stock/?key=…`. `.htaccess` sends everything under `/apps/van-stock/` through `/api/app.php`. That script checks the key, sets a cookie so the app's files load, and serves the app from `private/apps/van-stock/`. The key is written into the app's start address too, so the home-screen app keeps access on iPhone. Once installed, the app works offline as normal.
5. Anyone without a valid key sees a "Van Stock is for customers" page with a link to buy it.

You can also switch off access by hand: set `revoked = 1` on the buyer's row in `private/orders.sqlite`. Copies already installed keep working offline, but can't refresh from the server.

Products can also be sold as file downloads: give them a `file` rather than an `app` in `private/config.php`. `/api/download.php?token=…` then serves the file, with links that expire after 30 days and 5 downloads (configurable).

Needs PHP 8.1+ with `pdo_sqlite` and `curl`, and the host must be able to send mail with PHP `mail()`.

### Setting it up

1. **Stripe account:** sign up at stripe.com as a sole trader or company and complete the identity checks. Everything below can be done in **test mode** first (toggle at the top of the dashboard).
2. **Product:** Product catalogue > Add product: "Van Stock", one-off price **£12.00 GBP**. Copy the price ID (`price_…`).
3. **Settings:**
   - Settings > Public details: set the **Terms of service** URL to `https://www.uk-web-apps.co.uk/terms/` and the **Privacy policy** URL to `/privacy/`. Checkout's terms tick-box needs these.
   - Settings > Customer emails: turn on receipts for successful payments.
4. **Webhook:** Developers > Webhooks > Add endpoint `https://www.uk-web-apps.co.uk/api/stripe-webhook.php`, with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `charge.refunded`. Copy its signing secret (`whsec_…`).
5. **Private folder:** copy `private-example/` to the server as `private/`, **one level above the web root** (next to `public_html`, not inside it). Fill in `private/config.php`: the secret key (Developers > API keys, `sk_test_…` or `sk_live_…`), the webhook secret and the price ID. Then run `src/tools/package-van-stock.sh /path/to/vans` and upload the contents of `dist/apps/van-stock/` to `private/apps/van-stock/`. If your host doesn't allow folders outside the web root, use `public_html/private/`; `.htaccess` blocks it from the web.
6. **Open the shop:** set `shopOpen: true` in `src/data.mjs`, run `node src/build.mjs` and upload `public/`. Until then the page shows "Register your interest".
7. **Test a purchase** in test mode with card `4242 4242 4242 4242`, any future expiry date and any CVC, and a UK postcode. Check:
   - the link opens Van Stock and installs to a phone's home screen (try an iPhone and an Android if you can)
   - the email arrives
   - a refund in Stripe switches the link off
   - a non-UK billing country is refunded automatically
8. **Go live:** repeat steps 2–4 with test mode off. Put the live secret key, webhook secret and price ID in `private/config.php`.

To sell another app, add a `buy` block to its project in `src/data.mjs` and a matching entry under `products` in `private/config.php`.

**Never commit `private/`**: it holds secret keys and customer emails. It's in `.gitignore`.

### Updating the hosted Van Stock

When Van Stock changes, re-run `src/tools/package-van-stock.sh /path/to/vans` and upload the files to `private/apps/van-stock/` again. Buyers get the update the next time they open the app with signal. Remember to bump `CACHE` in the app's `sw.js` with each release, as usual.

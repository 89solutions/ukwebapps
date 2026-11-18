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

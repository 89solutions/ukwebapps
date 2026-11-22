<?php
// Copy this folder to the server as "private", ideally ONE LEVEL ABOVE the web root
// (next to public_html, not inside it), then fill in the values below.
// Never commit the real file: it contains secret keys.
return [
    // Stripe > Developers > API keys. Use the test key (sk_test_...) while testing, the live key (sk_live_...) when live.
    // A restricted key also works: it needs write access to Checkout Sessions and Refunds.
    'stripe_secret_key' => 'sk_test_xxxxxxxxxxxxxxxx',

    // Stripe > Developers > Webhooks: endpoint https://www.uk-web-apps.co.uk/api/stripe-webhook.php
    // listening for checkout.session.completed, checkout.session.async_payment_succeeded and charge.refunded.
    // Copy its signing secret. (charge.refunded switches off a refunded buyer's link automatically.)
    'stripe_webhook_secret' => 'whsec_xxxxxxxxxxxxxxxx',

    // Only sell to UK customers. Payments with a billing address outside the UK are refunded automatically,
    // so you don't have to register for EU VAT.
    'uk_only' => true,

    // Ask buyers to accept the terms and waive the cancellation period at checkout.
    // Needs a Terms of service URL (https://www.uk-web-apps.co.uk/terms/) in Stripe > Settings > Public details.
    'require_terms_consent' => true,

    'site_url' => 'https://www.uk-web-apps.co.uk',
    'shop_name' => 'Toffee Apple Web',
    'from_email' => 'info@uk-web-apps.co.uk',

    // Download links (file products only) expire after this many days and this many downloads.
    'link_days' => 30,
    'max_downloads' => 5,

    // One entry per product, keyed by the product's slug on the website.
    // price_id: Stripe > Product catalogue > (product) > the £12 one-off price (price_...).
    // Hosted web apps: set 'app' and put the app's files in private/apps/<app>/. Buyers get a personal
    //   link to https://www.uk-web-apps.co.uk/apps/<app>/?key=...
    // Downloads: set 'file' instead and put the file in private/files/.
    'products' => [
        'van-stock' => [
            'name' => 'Van Stock',
            'price_id' => 'price_xxxxxxxxxxxxxxxxxxxxxxxx',
            'app' => 'van-stock',
            'instructions' => "To put Van Stock on your phone:\n"
                . "- iPhone: open the link in Safari, tap the Share button, then Add to Home Screen.\n"
                . "- Android: open the link in Chrome, tap the menu, then Add to Home screen or Install app.\n"
                . "Then open Van Stock from your home screen. It works offline.\n\n"
                . "This link is personal to you, so please keep this email and don't share it.",
        ],
    ],
];

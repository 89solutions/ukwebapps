<?php
// Copy this folder to the server as "private", ideally ONE LEVEL ABOVE the web root
// (next to public_html, not inside it), then fill in the values below.
// Never commit the real file: it contains secret keys.
return [
    // 'sandbox' while testing, 'production' when live. Must match the client token in src/data.mjs.
    'paddle_environment' => 'sandbox',

    // Paddle > Developer tools > Authentication: an API key with read access to transactions and customers.
    'paddle_api_key' => 'pdl_sdbx_apikey_xxxxxxxxxxxxxxxx',

    // Paddle > Developer tools > Notifications: the secret key of the destination
    // https://www.uk-web-apps.co.uk/api/paddle-webhook.php (event: transaction.completed).
    'paddle_webhook_secret' => 'pdl_ntfset_xxxxxxxxxxxxxxxx',

    'site_url' => 'https://www.uk-web-apps.co.uk',
    'shop_name' => 'Toffee Apple Web',
    'from_email' => 'info@uk-web-apps.co.uk',

    // Download links expire after this many days and this many downloads.
    'link_days' => 30,
    'max_downloads' => 5,

    // One entry per product. price_id comes from Paddle > Catalog > Products > (product) > Prices.
    // The file goes in private/files/.
    'products' => [
        'van-stock' => [
            'name' => 'Van Stock',
            'price_id' => 'pri_xxxxxxxxxxxxxxxxxxxxxxxxxx',
            'file' => 'van-stock.zip',
            'instructions' => "How to install: (write the steps for this product here).",
        ],
    ],
];

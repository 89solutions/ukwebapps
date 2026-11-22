<?php
// Starts a Stripe Checkout for a product and returns the URL of Stripe's payment page.
declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only.');
$product = product((string) ($_POST['product'] ?? ''));
if (!$product) fail(404, 'That product isn’t for sale.');

$cfg = config();
$site = rtrim($cfg['site_url'], '/');
$params = [
    'mode' => 'payment',
    'locale' => 'en-GB',
    'line_items' => [[
        'quantity' => 1,
        'price' => $product['price_id'],
    ]],
    // We only sell to UK customers: collect the billing address so we can check (and refund if not UK).
    'billing_address_collection' => 'required',
    'metadata' => ['product' => $product['slug']],
    'payment_intent_data' => ['metadata' => ['product' => $product['slug']], 'description' => $product['name']],
    'success_url' => $site . '/work/' . $product['slug'] . '/thanks/?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url' => $site . '/work/' . $product['slug'] . '/#buy',
    'custom_text' => [
        'submit' => ['message' => 'UK customers only. You’ll get your personal ' . $product['name'] . ' link straight after paying.'],
    ],
];
if (!empty($cfg['require_terms_consent'])) {
    // Needs a Terms of service URL in Stripe > Settings > Public details.
    $params['consent_collection'] = ['terms_of_service' => 'required'];
    $params['custom_text']['terms_of_service_acceptance'] = ['message' =>
        'I agree to the [terms of sale](' . $site . '/terms/) and ask for ' . $product['name'] . ' to be supplied straight away. '
        . 'I understand my legal right to cancel ends once access starts; the 14-day [refund policy](' . $site . '/refunds/) still applies.'];
}

$session = stripe('POST', '/checkout/sessions', $params);
json_out(['url' => $session['url']]);

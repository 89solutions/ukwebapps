<?php
// Called by the thank-you page after Stripe Checkout: checks the payment and returns the buyer's link.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$sessionId = (string) ($_GET['session_id'] ?? '');
if (!preg_match('/^cs_(test|live)_[A-Za-z0-9]{10,200}$/', $sessionId)) fail(400, 'That order reference doesn’t look right.');

$existing = db()->prepare('SELECT * FROM orders WHERE transaction_id = ?');
$existing->execute([$sessionId]);
$order = $existing->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    $verified = verify_session(stripe('GET', '/checkout/sessions/' . rawurlencode($sessionId)));
    if ($verified === null) json_out(['pending' => true], 202); // payment still processing; the page retries
    [$product, $session] = $verified;
    $order = record_order($session, $product);
    email_order($order);
}

$cfg = config();
$product = $cfg['products'][$order['product']];
json_out([
    'product' => $product['name'],
    'type' => !empty($product['app']) ? 'app' : 'file',
    'url' => access_url($order),
    'email' => $order['email'],
    'link_days' => (int) $cfg['link_days'],
    'max_downloads' => (int) $cfg['max_downloads'],
]);

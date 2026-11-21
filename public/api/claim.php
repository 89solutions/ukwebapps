<?php
// Called by the thank-you page straight after checkout: checks the order with Paddle and returns the download link.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$txnId = (string) ($_GET['txn'] ?? '');
if (!preg_match('/^txn_[a-z0-9]{10,40}$/', $txnId)) fail(400, 'That order number doesn’t look right.');

$existing = db()->prepare('SELECT * FROM orders WHERE transaction_id = ?');
$existing->execute([$txnId]);
$order = $existing->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    $verified = verify_transaction(paddle_get('/transactions/' . rawurlencode($txnId)));
    if ($verified === null) json_out(['pending' => true], 202); // payment still processing; the page retries
    [$product, $txn] = $verified;
    $order = record_order($txn, $product);
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

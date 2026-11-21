<?php
// Paddle notification destination. Paddle calls this when a payment completes, so the buyer is emailed
// their download link even if they close the browser before the thank-you page loads.
declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only.');
$raw = (string) file_get_contents('php://input');

// Verify the Paddle-Signature header: "ts=...;h1=..." where h1 = HMAC-SHA256(ts + ":" + body, secret).
$parts = [];
foreach (explode(';', $_SERVER['HTTP_PADDLE_SIGNATURE'] ?? '') as $pair) {
    [$k, $v] = array_pad(explode('=', $pair, 2), 2, '');
    $parts[$k][] = $v;
}
$ts = $parts['ts'][0] ?? '';
if ($ts === '' || !ctype_digit($ts) || abs(time() - (int) $ts) > 300) fail(401, 'Bad or old signature.');
$expected = hash_hmac('sha256', $ts . ':' . $raw, config()['paddle_webhook_secret']);
$ok = false;
foreach ($parts['h1'] ?? [] as $sig) { if (hash_equals($expected, $sig)) $ok = true; }
if (!$ok) fail(401, 'Signature does not match.');

$event = json_decode($raw, true);
if (!is_array($event)) fail(400, 'Bad JSON.');
if (($event['event_type'] ?? '') !== 'transaction.completed') json_out(['ignored' => true]);

$txn = $event['data'] ?? [];
foreach ($txn['items'] ?? [] as $item) {
    if (product_for_price((string) ($item['price']['id'] ?? $item['price_id'] ?? ''))) {
        $verified = verify_transaction($txn);
        if ($verified) email_order(record_order($verified[1], $verified[0]));
        break;
    }
}
json_out(['ok' => true]);

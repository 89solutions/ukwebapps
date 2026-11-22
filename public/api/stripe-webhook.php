<?php
// Stripe webhook endpoint. Stripe calls this when a Checkout payment completes, so the buyer is emailed
// their link even if they close the browser before the thank-you page loads.
declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only.');
$raw = (string) file_get_contents('php://input');

// Verify the Stripe-Signature header: "t=...,v1=..." where v1 = HMAC-SHA256(t + "." + body, secret).
$t = '';
$sigs = [];
foreach (explode(',', $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '') as $pair) {
    [$k, $v] = array_pad(explode('=', trim($pair), 2), 2, '');
    if ($k === 't') $t = $v;
    if ($k === 'v1') $sigs[] = $v;
}
if ($t === '' || !ctype_digit($t) || abs(time() - (int) $t) > 300) fail(400, 'Bad or old signature.');
$expected = hash_hmac('sha256', $t . '.' . $raw, config()['stripe_webhook_secret']);
$ok = false;
foreach ($sigs as $sig) { if (hash_equals($expected, $sig)) $ok = true; }
if (!$ok) fail(400, 'Signature does not match.');

$event = json_decode($raw, true);
if (!is_array($event)) fail(400, 'Bad JSON.');
$type = (string) ($event['type'] ?? '');

// A refund made in the Stripe dashboard switches off that buyer's access.
if ($type === 'charge.refunded') {
    $pi = (string) ($event['data']['object']['payment_intent'] ?? '');
    if ($pi !== '') {
        foreach (stripe('GET', '/checkout/sessions', ['payment_intent' => $pi, 'limit' => 1])['data'] ?? [] as $s) {
            db()->prepare('UPDATE orders SET revoked = 1 WHERE transaction_id = ?')->execute([(string) $s['id']]);
        }
    }
    json_out(['ok' => true]);
}

if (!in_array($type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) json_out(['ignored' => true]);

$session = $event['data']['object'] ?? [];
if (!product((string) ($session['metadata']['product'] ?? ''))) json_out(['ignored' => true]); // not one of ours
$verified = verify_session($session, true);
if ($verified) email_order(record_order($verified[1], $verified[0]));
json_out(['ok' => true]);

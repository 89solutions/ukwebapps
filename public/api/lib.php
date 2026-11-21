<?php
// Shared helpers for Paddle purchases and downloads. Not called directly (blocked in .htaccess).
declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') { http_response_code(404); exit; }

/** Finds the private folder: above the web root if possible, otherwise public/private (blocked by .htaccess). */
function private_dir(): string
{
    foreach ([dirname(__DIR__, 2) . '/private', dirname(__DIR__) . '/private'] as $dir) {
        if (is_file($dir . '/config.php')) return $dir;
    }
    fail(500, 'Shop is not set up yet: private/config.php is missing.');
}

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require private_dir() . '/config.php';
        $live = ($cfg['paddle_environment'] ?? 'sandbox') === 'production';
        $cfg['api_base'] = $cfg['api_base'] ?? ($live ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com');
    }
    return $cfg;
}

/** The product a Paddle price ID belongs to, or null. */
function product_for_price(string $priceId): ?array
{
    foreach (config()['products'] as $slug => $p) {
        if (hash_equals($p['price_id'], $priceId)) return ['slug' => $slug] + $p;
    }
    return null;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . private_dir() . '/orders.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('CREATE TABLE IF NOT EXISTS orders (
            transaction_id TEXT PRIMARY KEY,
            product TEXT NOT NULL,
            email TEXT NOT NULL DEFAULT "",
            token TEXT NOT NULL UNIQUE,
            downloads INTEGER NOT NULL DEFAULT 0,
            emailed INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        )');
        // Set revoked = 1 (e.g. after a refund) to switch off a buyer's app access.
        $cols = array_column($pdo->query('PRAGMA table_info(orders)')->fetchAll(PDO::FETCH_ASSOC), 'name');
        if (!in_array('revoked', $cols, true)) $pdo->exec('ALTER TABLE orders ADD COLUMN revoked INTEGER NOT NULL DEFAULT 0');
    }
    return $pdo;
}

function paddle_get(string $path): array
{
    $ch = curl_init(config()['api_base'] . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . config()['paddle_api_key'], 'Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($body === false || $status >= 500) fail(502, 'Could not reach Paddle. Please try again in a minute.');
    $json = json_decode((string) $body, true);
    if ($status === 404) fail(404, 'We could not find that order.');
    if ($status >= 400 || !is_array($json)) fail(502, 'Paddle returned an error (' . $status . ').');
    return $json['data'] ?? [];
}

/** Checks a transaction is paid and for one of our products. Returns [product, transaction] or null if not paid yet. */
function verify_transaction(array $txn): ?array
{
    $product = null;
    foreach ($txn['items'] ?? [] as $item) {
        $product = product_for_price((string) ($item['price']['id'] ?? $item['price_id'] ?? ''));
        if ($product) break;
    }
    if (!$product) fail(400, 'That order is not for a product sold here.');
    if (!in_array($txn['status'] ?? '', ['paid', 'completed'], true)) return null;
    return [$product, $txn];
}

/** Saves the order once and returns it. Safe to call from both the thank-you page and the webhook. */
function record_order(array $txn, array $product): array
{
    $id = (string) $txn['id'];
    $email = '';
    if (!empty($txn['customer_id'])) {
        $customer = paddle_get('/customers/' . rawurlencode((string) $txn['customer_id']));
        $email = (string) ($customer['email'] ?? '');
    }
    db()->prepare('INSERT OR IGNORE INTO orders (transaction_id, product, email, token, created_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$id, $product['slug'], $email, bin2hex(random_bytes(24)), time()]);
    if ($email !== '') {
        db()->prepare('UPDATE orders SET email = ? WHERE transaction_id = ? AND email = ""')->execute([$email, $id]);
    }
    $stmt = db()->prepare('SELECT * FROM orders WHERE transaction_id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/** Hosted apps get a personal link to the app; file products get a download link. */
function access_url(array $order): string
{
    $product = config()['products'][$order['product']];
    $site = rtrim(config()['site_url'], '/');
    return !empty($product['app'])
        ? $site . '/apps/' . $product['app'] . '/?key=' . $order['token']
        : $site . '/api/download.php?token=' . $order['token'];
}

/** Emails the download link once per order. */
function email_order(array $order): void
{
    if ((int) $order['emailed'] === 1 || $order['email'] === '') return;
    $cfg = config();
    $product = $cfg['products'][$order['product']];
    $days = (int) $cfg['link_days'];
    $intro = !empty($product['app'])
        ? "Here's your personal link to {$product['name']}. Open it on your phone:\n"
        : "Download it here (the link works for {$days} days and up to {$cfg['max_downloads']} downloads):\n";
    $body = "Thanks for buying {$product['name']}!\n\n"
        . $intro . access_url($order) . "\n\n"
        . ($product['instructions'] ?? '') . "\n\n"
        . "Your order number is {$order['transaction_id']}. Your receipt comes separately from Paddle, our payment provider.\n\n"
        . "Any questions, just reply to this email.\n\n{$cfg['shop_name']}\n{$cfg['site_url']}\n";
    $headers = 'From: ' . $cfg['shop_name'] . ' <' . $cfg['from_email'] . ">\r\n"
        . 'Reply-To: ' . $cfg['from_email'] . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";
    if (mail($order['email'], 'Your ' . $product['name'] . (!empty($product['app']) ? ' link' : ' download'), $body, $headers)) {
        db()->prepare('UPDATE orders SET emailed = 1 WHERE transaction_id = ?')->execute([$order['transaction_id']]);
    }
}

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data);
    exit;
}

function fail(int $status, string $message): never
{
    json_out(['error' => $message], $status);
}

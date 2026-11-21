<?php
// Sends the purchased file for a valid, unexpired download link.
declare(strict_types=1);
require __DIR__ . '/lib.php';

function page(int $status, string $title, string $text): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    $c = config();
    echo '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . htmlspecialchars($title) . '</title><link rel="stylesheet" href="/assets/css/site.css"></head>'
        . '<body><main class="wrap narrow" style="padding:4rem 0"><h1 style="font-size:2rem">' . htmlspecialchars($title) . '</h1><p class="lead">' . $text . '</p>'
        . '<p>Email <a href="mailto:' . htmlspecialchars($c['from_email']) . '">' . htmlspecialchars($c['from_email']) . '</a> with your order number and we’ll sort it out.</p></main></body></html>';
    exit;
}

$token = (string) ($_GET['token'] ?? '');
if (!preg_match('/^[a-f0-9]{48}$/', $token)) page(404, 'Download link not found', 'That link isn’t complete. Please copy the whole link from your email.');

$stmt = db()->prepare('SELECT * FROM orders WHERE token = ?');
$stmt->execute([$token]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$order) page(404, 'Download link not found', 'We couldn’t find that download link.');

$cfg = config();
if (time() - (int) $order['created_at'] > (int) $cfg['link_days'] * 86400) page(410, 'This link has expired', 'Download links work for ' . (int) $cfg['link_days'] . ' days.');
if ((int) $order['downloads'] >= (int) $cfg['max_downloads']) page(410, 'Download limit reached', 'This link has already been used ' . (int) $cfg['max_downloads'] . ' times.');

$product = $cfg['products'][$order['product']] ?? null;
$file = $product ? private_dir() . '/files/' . basename($product['file']) : '';
if (!$product || !is_file($file)) page(500, 'Download not available', 'The file is missing on our side, sorry.');

db()->prepare('UPDATE orders SET downloads = downloads + 1 WHERE token = ?')->execute([$token]);
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($product['file']) . '"');
header('Content-Length: ' . filesize($file));
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
readfile($file);

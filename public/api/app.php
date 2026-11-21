<?php
// Serves a hosted app (e.g. /apps/van-stock/) only to buyers with a valid access key.
// .htaccess sends every request under /apps/<app>/ here. The app's files live in private/apps/<app>/.
//
// A buyer's link is /apps/<app>/?key=<token>. A valid key sets a cookie, so the app's other files load,
// and is written into the page's manifest link so the home-screen app keeps it (needed on iPhone,
// where home-screen apps don't share Safari's cookies).
declare(strict_types=1);
require __DIR__ . '/lib.php';

$app = (string) ($_GET['app'] ?? '');
$path = (string) ($_GET['path'] ?? '');
if (!preg_match('/^[a-z0-9-]{1,40}$/', $app)) not_found();
if ($path === '' || str_ends_with($path, '/')) $path .= 'index.html';
if (!preg_match('#^[A-Za-z0-9._/-]{1,200}$#', $path) || str_contains($path, '..')) not_found();

$base = realpath(private_dir() . '/apps/' . $app);
$file = $base ? realpath($base . '/' . $path) : false;
if (!$base || !$file || !str_starts_with($file, $base . DIRECTORY_SEPARATOR) || !is_file($file)) not_found();

// Icons and the favicon are public: browsers fetch them without cookies when installing the app.
$public = (bool) preg_match('#^(images/|favicon\.svg$)#', $path);

$cookie = 'app_' . str_replace('-', '_', $app);
$key = (string) ($_GET['key'] ?? $_COOKIE[$cookie] ?? '');
$order = null;
if (preg_match('/^[a-f0-9]{48}$/', $key)) {
    $stmt = db()->prepare('SELECT * FROM orders WHERE token = ? AND revoked = 0');
    $stmt->execute([$key]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($order && (config()['products'][$order['product']]['app'] ?? '') !== $app) $order = null;
}

if (!$order && !$public) {
    if (str_ends_with($path, '.html')) locked_page($app);
    http_response_code(403);
    header('Cache-Control: no-store');
    exit;
}

if ($order) {
    setcookie($cookie, $order['token'], [
        'expires' => time() + 10 * 365 * 86400, 'path' => '/apps/' . $app . '/',
        'secure' => ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Lax',
    ]);
}

$types = [
    'html' => 'text/html; charset=utf-8', 'js' => 'text/javascript; charset=utf-8', 'css' => 'text/css; charset=utf-8',
    'json' => 'application/json', 'webmanifest' => 'application/manifest+json', 'svg' => 'image/svg+xml',
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'webp' => 'image/webp', 'ico' => 'image/x-icon', 'txt' => 'text/plain; charset=utf-8',
];
$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('X-Robots-Tag: noindex');
// The app's own service worker handles offline caching; always check back with the server.
header('Cache-Control: ' . ($public ? 'public, max-age=86400' : 'private, no-cache'));

$body = (string) file_get_contents($file);
if ($order && $ext === 'html') {
    $body = preg_replace('/(<link[^>]+rel="manifest"[^>]+href=")([^"?]+)"/', '$1$2?key=' . $order['token'] . '"', $body, 1);
}
if ($order && $ext === 'webmanifest') {
    $manifest = json_decode($body, true);
    if (is_array($manifest)) {
        $manifest['start_url'] = './?key=' . $order['token'];
        $body = json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }
}
echo $body;

function not_found(): never
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}

function locked_page(string $app): never
{
    $name = 'this app';
    $buy = '/';
    foreach (config()['products'] as $slug => $p) {
        if (($p['app'] ?? '') === $app) { $name = $p['name']; $buy = '/work/' . $slug . '/#buy'; }
    }
    http_response_code(403);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    $n = htmlspecialchars($name);
    echo '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . $n . '</title><link rel="stylesheet" href="/assets/css/site.css"></head>'
        . '<body><main class="wrap narrow" style="padding:4rem 0"><h1 style="font-size:2rem">' . $n . ' is for customers</h1>'
        . '<p class="lead">Open ' . $n . ' using the personal link in your order email. If you bought it on this phone before, open that link again.</p>'
        . '<p class="btn-row"><a class="btn btn-primary" href="' . htmlspecialchars($buy) . '">Get ' . $n . '</a></p>'
        . '<p>Lost your link? Email <a href="mailto:' . htmlspecialchars(config()['from_email']) . '">' . htmlspecialchars(config()['from_email']) . '</a> with your order number.</p></main></body></html>';
    exit;
}

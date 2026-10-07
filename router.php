<?php
// Roteador para o servidor embutido do PHP:  php -S localhost:8000 router.php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/(data|inc|tools)(/|$)#', $path) || preg_match('#\.(php|phtml)$#i', $path) && str_starts_with($path, '/uploads/')) {
    http_response_code(403); exit('Forbidden');
}
if ($path !== '/' && is_file(__DIR__ . $path) && !preg_match('#\.php$#', $path)) return false;
if (str_ends_with($path, '/') && is_file(__DIR__ . $path . 'index.php')) { require __DIR__ . $path . 'index.php'; return true; }
if (preg_match('#\.php$#', $path) && is_file(__DIR__ . $path)) { require __DIR__ . $path; return true; }
require __DIR__ . '/index.php';

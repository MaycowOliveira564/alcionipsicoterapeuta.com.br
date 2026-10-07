<?php
declare(strict_types=1);

const ROOT = __DIR__ . '/..';
const DATA_DIR = ROOT . '/data';
const SITE_FILE = DATA_DIR . '/site.json';
const CONFIG_FILE = DATA_DIR . '/config.json';
const BACKUP_DIR = DATA_DIR . '/backups';
const UPLOAD_DIR = ROOT . '/uploads';

/* ---------- utilidades ---------- */

function esc($v): string
{
    return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function uid(string $p = 'x'): string
{
    return $p . substr(bin2hex(random_bytes(4)), 0, 7);
}

/** Caminho (URL) da raiz do site, ex.: "" ou "/meusite" */
function base_url(): string
{
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
    $dir = rtrim(dirname($script), '/');
    if (str_ends_with($dir, '/admin')) {
        $dir = substr($dir, 0, -6);
    }
    return $dir;
}

function full_origin(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

/** Converte caminho salvo (ex.: "uploads/x.jpg") em URL pública */
function asset_url(?string $p): string
{
    $p = trim((string)$p);
    if ($p === '') return '';
    if (preg_match('#^(https?:)?//#i', $p) || str_starts_with($p, 'data:')) return $p;
    return base_url() . '/' . ltrim($p, '/');
}

/* ---------- armazenamento (JSON, sem banco) ---------- */

function read_json(string $file, $default = [])
{
    if (!is_file($file)) return $default;
    $raw = file_get_contents($file);
    $j = json_decode($raw === false ? '' : $raw, true);
    return is_array($j) ? $j : $default;
}

function write_json_atomic(string $file, array $data): bool
{
    $dir = dirname($file);
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || file_put_contents($tmp, $json, LOCK_EX) === false) return false;
    return rename($tmp, $file);
}

function load_site(): array
{
    return read_json(SITE_FILE, ['settings' => [], 'sections' => []]);
}

function save_site(array $site): bool
{
    if (is_file(SITE_FILE)) {
        if (!is_dir(BACKUP_DIR)) mkdir(BACKUP_DIR, 0775, true);
        copy(SITE_FILE, BACKUP_DIR . '/site-' . date('Ymd-His') . '.json');
        $files = glob(BACKUP_DIR . '/site-*.json') ?: [];
        rsort($files);
        foreach (array_slice($files, 30) as $old) @unlink($old);
    }
    return write_json_atomic(SITE_FILE, $site);
}

/* ---------- sanitização (CSS / HTML) ---------- */

function css_color($v): string
{
    $v = trim((string)$v);
    if ($v === '') return '';
    if (preg_match('/^#[0-9a-f]{3,8}$/i', $v)) return $v;
    if (preg_match('/^(rgb|hsl)a?\(\s*[\d.,%\s\/-]+\)$/i', $v)) return $v;
    if (preg_match('/^var\(--c-[a-z0-9]+\)$/', $v)) return $v;
    if (in_array(strtolower($v), ['transparent', 'currentcolor', 'white', 'black'], true)) return strtolower($v);
    return '';
}

/** Comprimento CSS seguro: número (=> px), número+unidade, ou expressão calc/clamp/min/max (só números, unidades e operadores) */
function css_len($v): string
{
    if ($v === null || $v === '' || $v === false) return '';
    if (is_int($v) || is_float($v)) return $v . 'px';
    $v = trim((string)$v);
    if (preg_match('/^-?\d+(\.\d+)?$/', $v)) return $v . 'px';
    if (preg_match('/^-?\d+(\.\d+)?(px|%|rem|em|vh|vw|svh|dvh|ch)$/', $v)) return $v;
    if ($v === 'auto') return 'auto';
    if (preg_match('/^(calc|clamp|min|max)\(/i', $v) && strlen($v) < 200) {
        $unit = '(?:px|%|rem|em|vh|vw|svh|dvh|vmin|vmax|ch)?';
        $rest = preg_replace('/(calc|clamp|min|max)\(|\d+(?:\.\d+)?' . $unit . '|[(),+*\/\s-]/i', '', $v);
        $depth = 0;
        foreach (str_split($v) as $ch) { if ($ch === '(') $depth++; if ($ch === ')') $depth--; if ($depth < 0) return ''; }
        if ($rest === '' && $depth === 0) return $v;
    }
    return '';
}

/** Lista de comprimentos (ex.: border-radius "0 80px 0 80px") */
function css_lenlist($v): string
{
    $parts = preg_split('/\s+/', trim((string)$v)) ?: [];
    $out = [];
    foreach (array_slice($parts, 0, 4) as $p) {
        $l = css_len($p);
        if ($l === '') return '';
        $out[] = $l;
    }
    return implode(' ', $out);
}

function css_num($v, float $min = 0, float $max = 1000): string
{
    if ($v === '' || $v === null || !is_numeric($v)) return '';
    return (string)max($min, min($max, (float)$v));
}

function safe_url(?string $u, bool $allowRelative = true): string
{
    $u = trim((string)$u);
    if ($u === '') return '';
    if (preg_match('#^(https?:|mailto:|tel:|//)#i', $u)) return $u;
    if ($u[0] === '#') return $u;
    if ($allowRelative && !preg_match('#^[a-z][a-z0-9+.-]*:#i', $u)) return asset_url($u);
    return '';
}

function safe_icon($v): string
{
    $v = trim((string)$v);
    return preg_match('/^[a-z0-9 -]{0,60}$/i', $v) ? $v : '';
}

/** HTML rico permitido (negrito, listas, links, spans coloridos...) */
function sanitize_html(string $html): string
{
    if (trim($html) === '') return '';
    $allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'sub', 'sup', 'small', 'mark', 'div', 'hr'];
    $prev = libxml_use_internal_errors(true);
    $doc = new DOMDocument('1.0', 'UTF-8');
    $doc->loadHTML('<?xml encoding="UTF-8"><div id="__r">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($prev);
    $root = $doc->getElementById('__r');
    if (!$root) return esc(strip_tags($html));

    $clean = function (DOMNode $node) use (&$clean, $allowedTags, $doc) {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                $tag = strtolower($child->tagName);
                if (!in_array($tag, $allowedTags, true)) {
                    if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'noscript'], true)) {
                        $node->removeChild($child);
                        continue;
                    }
                    $clean($child);
                    while ($child->firstChild) $node->insertBefore($child->firstChild, $child);
                    $node->removeChild($child);
                    continue;
                }
                foreach (iterator_to_array($child->attributes) as $attr) {
                    $n = strtolower($attr->name);
                    $val = $attr->value;
                    $keep = false;
                    if ($tag === 'a' && $n === 'href') {
                        $u = safe_url($val, false);
                        if ($u !== '') { $child->setAttribute('href', $u); $keep = true; }
                    } elseif ($tag === 'a' && in_array($n, ['target', 'rel'], true)) {
                        $keep = true;
                    } elseif ($n === 'style') {
                        $safe = [];
                        foreach (explode(';', $val) as $decl) {
                            if (!str_contains($decl, ':')) continue;
                            [$p, $v] = array_map('trim', explode(':', $decl, 2));
                            $p = strtolower($p);
                            if ($p === 'color' || $p === 'background-color') { $c = css_color($v); if ($c !== '') $safe[] = "$p:$c"; }
                            elseif ($p === 'text-align' && in_array($v, ['left', 'right', 'center', 'justify'], true)) $safe[] = "$p:$v";
                            elseif ($p === 'font-weight' && preg_match('/^(normal|bold|[1-9]00)$/', $v)) $safe[] = "$p:$v";
                            elseif ($p === 'font-size' && css_len($v) !== '') $safe[] = "$p:" . css_len($v);
                        }
                        if ($safe) { $child->setAttribute('style', implode(';', $safe)); $keep = true; }
                    } elseif ($n === 'class' && preg_match('/^[a-z0-9 _-]{0,60}$/i', $val)) {
                        $keep = true;
                    }
                    if (!$keep) $child->removeAttribute($attr->name);
                }
                if ($tag === 'a' && $child->getAttribute('target') === '_blank') {
                    $child->setAttribute('rel', 'noopener noreferrer');
                }
                $clean($child);
            } elseif ($child instanceof DOMComment) {
                $node->removeChild($child);
            }
        }
    };
    $clean($root);
    $out = '';
    foreach ($root->childNodes as $c) $out .= $doc->saveHTML($c);
    return $out;
}

/* ---------- configuração / autenticação ---------- */

function config(): array
{
    return read_json(CONFIG_FILE, []);
}

function is_configured(): bool
{
    $c = config();
    return !empty($c['user']) && !empty($c['hash']);
}

function session_boot(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $dir = DATA_DIR . '/sessions';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    if (is_dir($dir) && is_writable($dir)) session_save_path($dir);
    session_name('alcioni_admin');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'secure' => $https, 'samesite' => 'Lax']);
    session_start();
}

function is_logged_in(): bool
{
    session_boot();
    return !empty($_SESSION['auth']) && (time() - ($_SESSION['last'] ?? 0)) < 60 * 60 * 8;
}

function csrf_token(): string
{
    session_boot();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
    return $_SESSION['csrf'];
}

function csrf_ok(?string $t): bool
{
    session_boot();
    return !empty($_SESSION['csrf']) && is_string($t) && hash_equals($_SESSION['csrf'], $t);
}

/** Limite simples de tentativas de login por IP (arquivo, sem banco) */
function login_throttled(string $ip, bool $register = false): bool
{
    $dir = DATA_DIR . '/.attempts';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $f = $dir . '/' . hash('sha256', $ip) . '.json';
    $d = read_json($f, ['t' => []]);
    $d['t'] = array_values(array_filter($d['t'], fn($t) => $t > time() - 900));
    if ($register) {
        $d['t'][] = time();
        write_json_atomic($f, $d);
    }
    return count($d['t']) >= 8;
}

function clear_attempts(string $ip): void
{
    @unlink(DATA_DIR . '/.attempts/' . hash('sha256', $ip) . '.json');
}

<?php
declare(strict_types=1);
require __DIR__ . '/../inc/render.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out($d, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!is_logged_in()) out(['error' => 'Sessão expirada. Faça login novamente.'], 401);
$_SESSION['last'] = time();
$action = $_GET['action'] ?? '';
$isPost = $_SERVER['REQUEST_METHOD'] === 'POST';
if ($isPost && !csrf_ok($_SERVER['HTTP_X_CSRF'] ?? null)) out(['error' => 'Token inválido. Recarregue a página.'], 403);

/** Higieniza recursivamente o conteúdo vindo do editor */
function clean_node($v, string $key = '')
{
    if (is_array($v)) {
        $o = [];
        foreach ($v as $k => $x) {
            if (is_string($k) && !preg_match('/^[A-Za-z0-9_]{1,40}$/', $k)) continue;
            $o[$k] = clean_node($x, (string)$k);
        }
        return $o;
    }
    if (is_string($v)) {
        if (in_array($key, ['html', 'a'], true)) return sanitize_html($v);
        if ($key === 'code') return $v; // widget HTML livre (somente administrador)
        return mb_substr($v, 0, 5000);
    }
    return is_bool($v) || is_int($v) || is_float($v) || $v === null ? $v : '';
}

function clean_site(array $in): array
{
    $site = ['settings' => clean_node($in['settings'] ?? []), 'sections' => []];
    $seen = [];
    $fixId = function (&$o, string $p) use (&$seen) {
        $id = preg_replace('/[^a-z0-9_-]/i', '', (string)($o['id'] ?? ''));
        if ($id === '' || isset($seen[$id])) $id = uid($p);
        $seen[$id] = 1;
        $o['id'] = $id;
    };
    foreach (($in['sections'] ?? []) as $sec) {
        if (!is_array($sec)) continue;
        $s = clean_node($sec);
        $fixId($s, 's');
        $s['anchor'] = preg_replace('/[^a-z0-9_-]/i', '', (string)($s['anchor'] ?? ''));
        $s['columns'] = array_values(array_filter($s['columns'] ?? [], 'is_array'));
        foreach ($s['columns'] as &$c) {
            $fixId($c, 'c');
            $c['widgets'] = array_values(array_filter($c['widgets'] ?? [], 'is_array'));
            foreach ($c['widgets'] as &$w) $fixId($w, 'w');
            unset($w);
        }
        unset($c);
        $site['sections'][] = $s;
    }
    return $site;
}

function body_json(): array
{
    $raw = file_get_contents('php://input');
    if (strlen((string)$raw) > 4 * 1024 * 1024) out(['error' => 'Conteúdo grande demais.'], 413);
    $j = json_decode((string)$raw, true);
    if (!is_array($j)) out(['error' => 'JSON inválido.'], 400);
    return $j;
}

function media_root_list(): array
{
    $items = [];
    if (!is_dir(UPLOAD_DIR)) return $items;
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(UPLOAD_DIR, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if (!$f->isFile()) continue;
        $ext = strtolower($f->getExtension());
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'], true)) continue;
        $rel = 'uploads/' . ltrim(str_replace('\\', '/', substr($f->getPathname(), strlen(UPLOAD_DIR))), '/');
        // oculta miniaturas geradas pelo WordPress (nome-300x200.jpg)
        if (preg_match('/-\d{2,4}x\d{2,4}\.[a-z]+$/i', $rel)) continue;
        $items[] = ['path' => $rel, 'url' => asset_url($rel), 'name' => $f->getFilename(), 'size' => $f->getSize(), 'time' => $f->getMTime(), 'svg' => $ext === 'svg'];
    }
    usort($items, fn($a, $b) => $b['time'] <=> $a['time']);
    return $items;
}

switch ($action) {
    case 'load':
        out(['site' => load_site(), 'csrf' => csrf_token()]);

    case 'save':
        if (!$isPost) out(['error' => 'Método inválido'], 405);
        $site = clean_site(body_json());
        if (!save_site($site)) out(['error' => 'Não foi possível gravar em data/site.json. Verifique as permissões da pasta data/.'], 500);
        out(['ok' => true, 'site' => $site, 'time' => date('H:i:s')]);

    case 'preview':
        if (!$isPost) out(['error' => 'Método inválido'], 405);
        $site = clean_site(body_json());
        out(render_content($site, true));

    case 'media':
        out(['items' => media_root_list()]);

    case 'upload':
        if (!$isPost) out(['error' => 'Método inválido'], 405);
        $saved = [];
        $errors = [];
        $files = $_FILES['files'] ?? null;
        if (!$files) out(['error' => 'Nenhum arquivo enviado (verifique upload_max_filesize no PHP).'], 400);
        $names = (array)$files['name'];
        foreach ($names as $i => $orig) {
            if (($files['error'][$i] ?? 1) !== UPLOAD_ERR_OK) { $errors[] = "$orig: erro no envio"; continue; }
            if ($files['size'][$i] > 15 * 1024 * 1024) { $errors[] = "$orig: maior que 15MB"; continue; }
            $tmp = $files['tmp_name'][$i];
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
            $map = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif', 'image/avif' => 'avif', 'image/svg+xml' => 'svg', 'text/plain' => null, 'text/xml' => null];
            $ext = $map[$mime] ?? null;
            if ($ext === null && in_array($mime, ['text/plain', 'text/xml', 'application/xml'], true) && strtolower(pathinfo($orig, PATHINFO_EXTENSION)) === 'svg' && stripos((string)file_get_contents($tmp, false, null, 0, 4000), '<svg') !== false) $ext = 'svg';
            if ($ext === null) { $errors[] = "$orig: tipo de arquivo não permitido"; continue; }
            $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', pathinfo($orig, PATHINFO_FILENAME)) ?: 'imagem')), '-') ?: 'imagem';
            $dir = UPLOAD_DIR . '/' . date('Y') . '/' . date('m');
            if (!is_dir($dir)) mkdir($dir, 0775, true);
            $name = substr($slug, 0, 50) . '-' . substr(bin2hex(random_bytes(3)), 0, 5) . '.' . $ext;
            $dest = $dir . '/' . $name;
            if ($ext === 'svg') {
                $svg = (string)file_get_contents($tmp);
                $svg = preg_replace('#<script.*?</script>|<foreignObject.*?</foreignObject>|<!ENTITY[^>]*>#is', '', $svg);
                $svg = preg_replace('#\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\')#i', '', $svg);
                $svg = preg_replace('#(href|xlink:href)\s*=\s*("|\')\s*javascript:[^"\']*\2#i', '', $svg);
                file_put_contents($dest, $svg);
            } else {
                $moved = move_uploaded_file($tmp, $dest);
                if (!$moved) { $errors[] = "$orig: falha ao gravar"; continue; }
                if (in_array($ext, ['jpg', 'png', 'webp'], true) && function_exists('imagecreatefromjpeg')) {
                    [$w, $h] = @getimagesize($dest) ?: [0, 0];
                    $max = 2400;
                    if ($w > $max || $h > $max) {
                        $src = match ($ext) { 'jpg' => @imagecreatefromjpeg($dest), 'png' => @imagecreatefrompng($dest), default => @imagecreatefromwebp($dest) };
                        if ($src) {
                            $r = min($max / $w, $max / $h);
                            $nw = (int)round($w * $r); $nh = (int)round($h * $r);
                            $dst = imagecreatetruecolor($nw, $nh);
                            if ($ext !== 'jpg') { imagealphablending($dst, false); imagesavealpha($dst, true); }
                            imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
                            if ($ext === 'jpg') {
                                if (function_exists('exif_read_data') && ($ex = @exif_read_data($dest)) && !empty($ex['Orientation'])) {
                                    $rot = [3 => 180, 6 => -90, 8 => 90][$ex['Orientation']] ?? 0;
                                    if ($rot) $dst = imagerotate($dst, $rot, 0);
                                }
                                imagejpeg($dst, $dest, 86);
                            } elseif ($ext === 'png') imagepng($dst, $dest, 7);
                            else imagewebp($dst, $dest, 86);
                        }
                    }
                }
            }
            @chmod($dest, 0644);
            $rel = 'uploads/' . date('Y') . '/' . date('m') . '/' . $name;
            $saved[] = ['path' => $rel, 'url' => asset_url($rel), 'name' => $name];
        }
        out(['saved' => $saved, 'errors' => $errors]);

    case 'media_delete':
        if (!$isPost) out(['error' => 'Método inválido'], 405);
        $p = (string)(body_json()['path'] ?? '');
        $real = realpath(ROOT . '/' . $p);
        $up = realpath(UPLOAD_DIR);
        if (!$real || !$up || !str_starts_with($real, $up . DIRECTORY_SEPARATOR) || !is_file($real)) out(['error' => 'Arquivo não encontrado.'], 404);
        @unlink($real);
        out(['ok' => true]);

    case 'backups':
        $list = [];
        foreach (glob(BACKUP_DIR . '/site-*.json') ?: [] as $f) {
            $b = basename($f);
            if (preg_match('/^site-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.json$/', $b, $m)) $list[] = ['file' => $b, 'label' => "$m[3]/$m[2]/$m[1] $m[4]:$m[5]:$m[6]"];
        }
        usort($list, fn($a, $b) => strcmp($b['file'], $a['file']));
        out(['items' => $list]);

    case 'restore':
        if (!$isPost) out(['error' => 'Método inválido'], 405);
        $f = (string)(body_json()['file'] ?? '');
        if (!preg_match('/^site-\d{8}-\d{6}\.json$/', $f) || !is_file(BACKUP_DIR . '/' . $f)) out(['error' => 'Versão não encontrada.'], 404);
        $d = read_json(BACKUP_DIR . '/' . $f, null);
        if (!$d) out(['error' => 'Arquivo inválido.'], 400);
        out(['site' => $d]);

    case 'password':
        if (!$isPost) out(['error' => 'Método inválido'], 405);
        $b = body_json();
        $c = config();
        if (!password_verify((string)($b['current'] ?? ''), $c['hash'] ?? '')) out(['error' => 'Senha atual incorreta.'], 400);
        $new = (string)($b['new'] ?? '');
        if (mb_strlen($new) < 10) out(['error' => 'A nova senha precisa ter pelo menos 10 caracteres.'], 400);
        $user = trim((string)($b['user'] ?? $c['user']));
        if ($user === '' || mb_strlen($user) > 60) out(['error' => 'Usuário inválido.'], 400);
        $c['user'] = $user;
        $c['hash'] = password_hash($new, PASSWORD_DEFAULT);
        write_json_atomic(CONFIG_FILE, $c);
        out(['ok' => true]);

    default:
        out(['error' => 'Ação desconhecida'], 400);
}

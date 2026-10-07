<?php
declare(strict_types=1);
require __DIR__ . '/../inc/lib.php';

session_boot();
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: no-store');
$b = base_url();
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$err = '';

if (($_GET['logout'] ?? '') === '1' && csrf_ok($_GET['t'] ?? null)) {
    $_SESSION = [];
    session_destroy();
    header('Location: ' . $b . '/admin/');
    exit;
}

if (!is_configured()) {
    // Primeiro acesso: cria o usuário administrador
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $u = trim((string)($_POST['user'] ?? ''));
        $p = (string)($_POST['pass'] ?? '');
        if (!csrf_ok($_POST['csrf'] ?? null)) $err = 'Sessão inválida, tente novamente.';
        elseif ($u === '' || mb_strlen($u) > 60) $err = 'Informe um usuário.';
        elseif (mb_strlen($p) < 10) $err = 'A senha precisa ter pelo menos 10 caracteres.';
        elseif ($p !== (string)($_POST['pass2'] ?? '')) $err = 'As senhas não conferem.';
        else {
            if (!write_json_atomic(CONFIG_FILE, ['user' => $u, 'hash' => password_hash($p, PASSWORD_DEFAULT), 'created' => date('c')])) $err = 'Não foi possível gravar data/config.json (permissões da pasta data/).';
            else { session_regenerate_id(true); $_SESSION['auth'] = 1; $_SESSION['last'] = time(); header('Location: ' . $b . '/admin/'); exit; }
        }
    }
    auth_page('Criar acesso ao painel', 'setup', $err);
    exit;
}

if (!is_logged_in()) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $c = config();
        if (login_throttled($ip)) $err = 'Muitas tentativas. Aguarde 15 minutos.';
        elseif (!csrf_ok($_POST['csrf'] ?? null)) $err = 'Sessão inválida, tente novamente.';
        else {
            $ok = hash_equals((string)$c['user'], (string)($_POST['user'] ?? '')) && password_verify((string)($_POST['pass'] ?? ''), $c['hash']);
            if ($ok) {
                clear_attempts($ip);
                session_regenerate_id(true);
                $_SESSION['auth'] = 1;
                $_SESSION['last'] = time();
                header('Location: ' . $b . '/admin/');
                exit;
            }
            login_throttled($ip, true);
            usleep(400000);
            $err = 'Usuário ou senha incorretos.';
        }
    }
    auth_page('Entrar no painel', 'login', $err);
    exit;
}

function auth_page(string $title, string $mode, string $err): void
{
    $b = base_url(); ?>
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title><?= esc($title) ?></title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#5f5e5c,#3d3c3b);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:20px}
form{background:#fffaf4;border-radius:18px;padding:34px;width:100%;max-width:400px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)}
img{display:block;margin:0 auto 18px;height:56px}h1{font-size:1.2rem;text-align:center;margin:0 0 20px;color:#5f5e5c}
label{display:block;font-size:.8rem;font-weight:600;color:#5f5e5c;margin:14px 0 6px}
input{width:100%;padding:12px 14px;border:1px solid #d8cfc5;border-radius:10px;font-size:1rem;background:#fff}input:focus{outline:2px solid #d48a67;border-color:transparent}
button{margin-top:22px;width:100%;padding:13px;border:0;border-radius:10px;background:#d48a67;color:#fff;font-weight:700;font-size:1rem;cursor:pointer}button:hover{background:#c27a58}
.err{background:#fde8e4;color:#a1301b;padding:10px 12px;border-radius:8px;font-size:.88rem;margin-bottom:6px}.hint{font-size:.78rem;color:#7a766f;margin-top:10px;line-height:1.4}
</style></head><body>
<form method="post" autocomplete="on">
<img src="<?= esc($b) ?>/uploads/2025/07/logo-alcioni.png" alt="">
<h1><?= esc($title) ?></h1>
<?php if ($err): ?><div class="err"><?= esc($err) ?></div><?php endif; ?>
<?php if ($mode === 'setup'): ?><p class="hint">Primeiro acesso: defina o usuário e a senha do administrador. Guarde-os em local seguro.</p><?php endif; ?>
<input type="hidden" name="csrf" value="<?= esc(csrf_token()) ?>">
<label>Usuário</label><input name="user" required autocomplete="username" autofocus>
<label>Senha</label><input type="password" name="pass" required autocomplete="<?= $mode === 'setup' ? 'new-password' : 'current-password' ?>" <?= $mode === 'setup' ? 'minlength="10"' : '' ?>>
<?php if ($mode === 'setup'): ?><label>Repita a senha</label><input type="password" name="pass2" required autocomplete="new-password" minlength="10"><?php endif; ?>
<button><?= $mode === 'setup' ? 'Criar e entrar' : 'Entrar' ?></button>
</form></body></html>
<?php }

$ver = (string)(@filemtime(__DIR__ . '/assets/editor.js') ?: 1);
$cfg = ['base' => $b, 'csrf' => csrf_token(), 'logout' => $b . '/admin/?logout=1&t=' . csrf_token()];
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Editor do site</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">
<link rel="stylesheet" href="<?= esc($b) ?>/admin/assets/editor.css?v=<?= $ver ?>">
</head>
<body>
<div id="app"><div class="loading">Carregando editor…</div></div>
<script>window.CFG=<?= json_encode($cfg, JSON_UNESCAPED_SLASHES) ?>;</script>
<script src="<?= esc($b) ?>/admin/assets/vendor/Sortable.min.js"></script>
<script src="<?= esc($b) ?>/admin/assets/editor.js?v=<?= $ver ?>"></script>
</body>
</html>

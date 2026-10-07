<?php
declare(strict_types=1);
require __DIR__ . '/inc/render.php';

$site = load_site();
$out = render_content($site);
$st = $site['settings'] ?? [];
$b = base_url();
$ver = @filemtime(__DIR__ . '/assets/site.css') ?: 1;
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="<?= esc($st['lang'] ?? 'pt-BR') ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?= head_extra($site) ?>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="<?= esc(fonts_link($site)) ?>">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">
<link rel="stylesheet" href="<?= $b ?>/assets/site.css?v=<?= $ver ?>">
<script>document.documentElement.classList.add('js')</script>
<script src="https://cdn.tailwindcss.com"></script>
<style id="dyn"><?= $out['css'] ?></style>
</head>
<body>
<div id="prog"></div>
<div id="page"><?= $out['html'] ?></div>
<nav id="dots" aria-label="Seções"></nav>
<div id="lbx"></div>
<?php if (($st['backToTop'] ?? true) !== false): ?><button type="button" id="totop" aria-label="Voltar ao topo" title="Voltar ao topo"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button><?php endif; ?>
<script>window.SITE_CFG=<?= json_encode(['autoscroll' => ($st['autoscroll'] ?? 'sections')], JSON_UNESCAPED_SLASHES) ?>;</script>
<script src="<?= $b ?>/assets/site.js?v=<?= $ver ?>" defer></script>
</body>
</html>

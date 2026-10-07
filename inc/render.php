<?php
declare(strict_types=1);

require_once __DIR__ . '/lib.php';

/** Valor responsivo: escalar => só desktop; ou {d,t,m} */
function rv($v): array
{
    if (is_array($v)) {
        return ['d' => $v['d'] ?? '', 't' => $v['t'] ?? '', 'm' => $v['m'] ?? ''];
    }
    return ['d' => $v ?? '', 't' => '', 'm' => ''];
}

/** Acumulador de CSS responsivo (desktop base, tablet <=1023, mobile <=639) */
class Css
{
    public array $b = ['d' => [], 'dx' => [], 't' => [], 'tx' => [], 'm' => []];

    public function rule(string $sel, string $prop, $value, callable $filter): void
    {
        foreach (rv($value) as $dev => $val) {
            if ($val === '' || $val === null || $val === false) continue;
            $f = $filter($val);
            if ($f === '' || $f === null) continue;
            $this->b[$dev][$sel][] = "$prop:$f";
        }
    }

    public function raw(string $dev, string $sel, string $decl): void
    {
        $this->b[$dev][$sel][] = $decl;
    }

    /** Oculta só no dispositivo indicado (d >=1024, t 640-1023, m <=639) */
    public function hide(string $dev, string $sel): void
    {
        $this->b[['d' => 'dx', 't' => 'tx', 'm' => 'm'][$dev]][$sel][] = 'display:none!important';
    }

    public function out(): string
    {
        $s = '';
        $wrap = ['d' => ['', ''], 'dx' => ['@media(min-width:1024px){', '}'], 't' => ['@media(max-width:1023px){', '}'], 'tx' => ['@media(min-width:640px) and (max-width:1023px){', '}'], 'm' => ['@media(max-width:639px){', '}']];
        foreach ($this->b as $dev => $rules) {
            if (!$rules) continue;
            $s .= $wrap[$dev][0];
            foreach ($rules as $sel => $decls) $s .= $sel . '{' . implode(';', $decls) . '}';
            $s .= $wrap[$dev][1];
        }
        return $s;
    }
}

function f_len($v): string { return css_len($v); }
function f_color($v): string { return css_color($v); }
function f_num($v): string { return css_num($v); }
function f_align($v): string { return in_array($v, ['left', 'center', 'right', 'justify'], true) ? $v : ''; }

function anim_attrs(array $p): string
{
    $a = $p['anim'] ?? '';
    if (!in_array($a, ['fade-up', 'fade-down', 'fade-left', 'fade-right', 'zoom-in', 'fade-in', 'slide-up'], true)) return '';
    $d = (int)($p['delay'] ?? 0);
    return ' data-anim="' . $a . '"' . ($d > 0 ? ' style="--ad:' . min($d, 3000) . 'ms"' : '');
}

function common_widget_css(Css $css, string $sel, array $p): void
{
    $css->rule($sel, 'text-align', $p['align'] ?? '', 'f_align');
    $css->rule($sel, 'margin-top', $p['mt'] ?? '', 'f_len');
    $css->rule($sel, 'margin-bottom', $p['mb'] ?? '', 'f_len');
    $css->rule($sel, 'max-width', $p['maxw'] ?? '', 'f_len');
    foreach (rv($p['hide'] ?? []) as $dev => $h) {
        if ($h) $css->hide($dev, $sel);
    }
    if (!empty($p['maxw'])) {
        $al = rv($p['align'] ?? '');
        $css->raw('d', $sel, 'margin-left:' . ($al['d'] === 'center' ? 'auto' : ($al['d'] === 'right' ? 'auto' : '0')) . ';margin-right:' . ($al['d'] === 'center' ? 'auto' : '0'));
    }
}

/* ---------- ícones / media ---------- */

function icon_html(string $icon, string $extra = ''): string
{
    $icon = safe_icon($icon);
    if ($icon === '') return '';
    return '<i class="' . esc($icon) . ' ' . esc($extra) . '" aria-hidden="true"></i>';
}

function img_tag(string $src, string $alt = '', string $cls = '', string $style = '', bool $lazy = true): string
{
    $url = asset_url($src);
    if ($url === '') return '';
    $dim = '';
    $local = ROOT . '/' . ltrim($src, '/');
    if (!preg_match('#^(https?:)?//#', $src) && is_file($local) && !str_ends_with(strtolower($src), '.svg')) {
        $s = @getimagesize($local);
        if ($s) $dim = ' width="' . $s[0] . '" height="' . $s[1] . '"';
    }
    return '<img src="' . esc($url) . '" alt="' . esc($alt) . '"' . $dim . ($cls ? ' class="' . esc($cls) . '"' : '') . ($style ? ' style="' . esc($style) . '"' : '') . ($lazy ? ' loading="lazy" decoding="async"' : '') . '>';
}

/** SVG local inline (herda a cor do texto via currentColor); '' se não for SVG local */
function inline_svg(string $src): string
{
    if (!str_ends_with(strtolower($src), '.svg') || preg_match('#^(https?:)?//#', $src) || str_contains($src, '..')) return '';
    $f = ROOT . '/' . ltrim($src, '/');
    if (!is_file($f) || filesize($f) > 200000) return '';
    $svg = (string)file_get_contents($f);
    $svg = preg_replace('#<\?xml.*?\?>|<!DOCTYPE.*?>|<script.*?</script>|<foreignObject.*?</foreignObject>#is', '', $svg);
    $svg = preg_replace('#\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\')#i', '', $svg);
    $svg = preg_replace('#<svg\b#i', '<svg fill="currentColor" aria-hidden="true" focusable="false"', $svg, 1);
    $svg = preg_replace('#\s(width|height)="[^"]*"#i', '', $svg, 2);
    return $svg;
}

function video_embed(string $url, string $ratio): string
{
    $url = trim($url);
    $src = '';
    if (preg_match('#(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})#', $url, $m)) $src = 'https://www.youtube-nocookie.com/embed/' . $m[1];
    elseif (preg_match('#vimeo\.com/(\d+)#', $url, $m)) $src = 'https://player.vimeo.com/video/' . $m[1];
    $ar = preg_match('#^\d+/\d+$#', $ratio) ? $ratio : '16/9';
    if ($src) return '<div class="vid" style="aspect-ratio:' . $ar . '"><iframe src="' . esc($src) . '" loading="lazy" allowfullscreen title="Vídeo" allow="accelerometer; encrypted-media; picture-in-picture"></iframe></div>';
    if (preg_match('#\.(mp4|webm)$#i', $url)) return '<div class="vid" style="aspect-ratio:' . $ar . '"><video src="' . esc(asset_url($url)) . '" controls playsinline preload="metadata"></video></div>';
    return '';
}

/* ---------- widgets ---------- */

function render_widget(array $w, Css $css, bool $editor): string
{
    $id = preg_replace('/[^a-z0-9_-]/i', '', (string)($w['id'] ?? uid('w')));
    $type = $w['type'] ?? '';
    $p = $w['p'] ?? [];
    $sel = ".e-$id";
    common_widget_css($css, $sel, $p);
    $inner = '';

    switch ($type) {
        case 'heading':
            $tag = in_array($p['tag'] ?? 'h2', ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'], true) ? $p['tag'] : 'h2';
            $css->rule("$sel .hd", 'font-size', $p['size'] ?? '', 'f_len');
            $css->rule("$sel .hd", 'color', $p['color'] ?? '', 'f_color');
            $css->rule("$sel .hd", 'line-height', $p['lh'] ?? '', 'f_num');
            if (!empty($p['weight']) && preg_match('/^[1-9]00$/', (string)$p['weight'])) $css->raw('d', "$sel .hd", 'font-weight:' . $p['weight']);
            if (($p['family'] ?? '') === 'script') $css->raw('d', "$sel .hd", 'font-family:var(--f-script)');
            if (!empty($p['italic'])) $css->raw('d', "$sel .hd", 'font-style:italic');
            if (!empty($p['upper'])) $css->raw('d', "$sel .hd", 'text-transform:uppercase');
            $inner = "<$tag class=\"hd\">" . ($p['html'] ?? '') . "</$tag>";
            break;

        case 'text':
            $css->rule("$sel .tx", 'font-size', $p['size'] ?? '', 'f_len');
            $css->rule("$sel .tx", 'color', $p['color'] ?? '', 'f_color');
            $css->rule("$sel .tx", 'line-height', $p['lh'] ?? '', 'f_num');
            $inner = '<div class="tx rich">' . ($p['html'] ?? '') . '</div>';
            break;

        case 'image':
            $im = "$sel .im"; $ii = "$sel .im img";
            $css->rule($im, 'width', $p['w'] ?? '', 'f_len');
            $css->rule($im, 'height', $p['h'] ?? '', 'f_len');
            $css->rule($im, 'aspect-ratio', $p['ratio'] ?? '', fn($v) => preg_match('#^\d+(\.\d+)?/\d+(\.\d+)?$#', (string)$v) ? (string)$v : '');
            $css->rule($im, '--ox', $p['objX'] ?? '', fn($v) => css_num($v, 0, 100) !== '' ? css_num($v, 0, 100) . '%' : '');
            $css->rule($im, '--oy', $p['objY'] ?? '', fn($v) => css_num($v, 0, 100) !== '' ? css_num($v, 0, 100) . '%' : '');
            $css->rule($im, '--z', $p['zoom'] ?? '', fn($v) => css_num($v, 20, 400) !== '' ? (string)(css_num($v, 20, 400) / 100) : '');
            foreach (rv($p['align'] ?? '') as $dev => $al) {
                if (isset(['left' => 1, 'center' => 1, 'right' => 1][$al])) $css->raw($dev, $im, 'margin:' . ['left' => '0 auto 0 0', 'center' => '0 auto', 'right' => '0 0 0 auto'][$al]);
            }
            $css->rule($im, 'border-radius', $p['radius'] ?? '', 'css_lenlist');
            if (!empty($p['shadow'])) $css->raw('d', $im, 'box-shadow:0 22px 48px -18px rgba(0,0,0,.4)');
            $fixed = !empty($p['ratio']) || !empty($p['h']);
            $fit = in_array($p['fit'] ?? '', ['cover', 'contain', 'fill'], true) ? $p['fit'] : 'cover';
            if ($fixed || !empty($p['zoom']) || ($p['fit'] ?? '') !== '') $css->raw('d', $ii, 'height:100%;object-fit:' . $fit);
            if (!empty($p['invert'])) $css->raw('d', $ii, 'filter:brightness(0) invert(1)');
            $tagImg = img_tag((string)($p['src'] ?? ''), (string)($p['alt'] ?? ''), '', '');
            if ($tagImg === '' && $editor) $tagImg = '<div class="ph">Selecione uma imagem</div>';
            $link = safe_url($p['link'] ?? '');
            $inner = $link ? '<a href="' . esc($link) . '"' . (!empty($p['newtab']) ? ' target="_blank" rel="noopener"' : '') . '>' . $tagImg . '</a>' : $tagImg;
            $inner = '<div class="im' . (!empty($p['hover']) ? ' hzw' : '') . '">' . $inner . '</div>';
            break;

        case 'button':
            $bs = "$sel .btn";
            $css->rule($bs, 'background-color', $p['bg'] ?? '', 'f_color');
            $css->rule($bs, 'color', $p['color'] ?? '', 'f_color');
            $css->rule($bs, 'font-size', $p['size'] ?? '', 'f_len');
            if (!empty($p['radius']) && css_lenlist($p['radius']) !== '') $css->raw('d', $bs, 'border-radius:' . css_lenlist($p['radius']));
            if (!empty($p['full'])) $css->raw('d', $bs, 'display:flex;width:100%');
            $var = in_array($p['variant'] ?? 'solid', ['solid', 'outline', 'ghost'], true) ? $p['variant'] : 'solid';
            $url = safe_url($p['url'] ?? '') ?: '#';
            $nt = !empty($p['newtab']) || preg_match('#^https?://#', $url) && !str_contains($url, $_SERVER['HTTP_HOST'] ?? '@@');
            $inner = '<a href="' . esc($url) . '" class="btn btn-' . $var . '"' . ($nt ? ' target="_blank" rel="noopener noreferrer"' : '') . '>'
                . (($p['iconPos'] ?? 'left') === 'left' ? icon_html((string)($p['icon'] ?? ''), 'bi') : '')
                . '<span>' . esc($p['text'] ?? 'Botão') . '</span>'
                . (($p['iconPos'] ?? 'left') === 'right' ? icon_html((string)($p['icon'] ?? ''), 'bi') : '')
                . '</a>';
            break;

        case 'iconbox':
            $css->rule("$sel .ib-i", 'background-color', $p['iconBg'] ?? '', 'f_color');
            $css->rule("$sel .ib-i", 'color', $p['iconColor'] ?? '', 'f_color');
            $css->rule("$sel .ib-i", 'width', $p['iconBox'] ?? '', 'f_len');
            $css->rule("$sel .ib-i", 'height', $p['iconBox'] ?? '', 'f_len');
            $css->rule("$sel .ib-i i", 'font-size', $p['iconSize'] ?? '', 'f_len');
            $css->rule("$sel .ib-i img", 'width', $p['iconSize'] ?? '', 'f_len');
            $css->rule("$sel .ib-i svg", 'width', $p['iconSize'] ?? '', 'f_len');
            $css->rule("$sel .ib-i svg", 'height', $p['iconSize'] ?? '', 'f_len');
            $css->rule("$sel .ib-t", 'font-size', $p['size'] ?? '', 'f_len');
            $css->rule("$sel .ib-t", 'color', $p['color'] ?? '', 'f_color');
            $ic = !empty($p['img']) ? (inline_svg((string)$p['img']) ?: img_tag((string)$p['img'], '', '', '', false)) : icon_html((string)($p['icon'] ?? ''));
            $inner = '<div class="ib">' . ($ic ? '<div class="ib-i">' . $ic . '</div>' : '')
                . (($p['title'] ?? '') !== '' ? '<h3 class="ib-t">' . esc($p['title']) . '</h3>' : '')
                . (($p['text'] ?? '') !== '' ? '<p class="ib-p">' . nl2br(esc($p['text'])) . '</p>' : '') . '</div>';
            break;

        case 'spacer':
            $css->rule("$sel .sp", 'height', $p['h'] ?? '40', 'f_len');
            $inner = '<div class="sp"></div>';
            break;

        case 'divider':
            $css->rule("$sel hr", 'border-color', $p['color'] ?? '', 'f_color');
            $css->rule("$sel hr", 'width', $p['w'] ?? '', 'f_len');
            $css->rule("$sel hr", 'border-top-width', $p['th'] ?? '', 'f_len');
            $inner = '<hr class="dv">';
            break;

        case 'html':
            $inner = '<div class="rawhtml">' . ($p['code'] ?? '') . '</div>';
            break;

        case 'video':
            $inner = video_embed((string)($p['url'] ?? ''), (string)($p['ratio'] ?? '16/9'));
            if ($inner === '' && $editor) $inner = '<div class="ph">Cole um link do YouTube/Vimeo ou .mp4</div>';
            break;

        case 'gallery':
            $css->rule("$sel .gal", 'grid-template-columns', $p['cols'] ?? ['d' => 3, 't' => 2, 'm' => 1], fn($n) => 'repeat(' . max(1, min(6, (int)$n)) . ',minmax(0,1fr))');
            $css->rule("$sel .gal", 'gap', $p['gap'] ?? '16', 'f_len');
            if (!empty($p['radius']) && css_lenlist($p['radius']) !== '') $css->raw('d', "$sel .gal img", 'border-radius:' . css_lenlist($p['radius']));
            if (!empty($p['ratio']) && preg_match('#^\d+/\d+$#', (string)$p['ratio'])) $css->raw('d', "$sel .gal img", 'aspect-ratio:' . $p['ratio'] . ';object-fit:cover;width:100%');
            $items = '';
            foreach (($p['items'] ?? []) as $it) {
                $im = img_tag((string)($it['src'] ?? ''), (string)($it['alt'] ?? ''));
                if ($im === '') continue;
                $items .= !empty($p['lightbox'])
                    ? '<a href="' . esc(asset_url((string)$it['src'])) . '" class="lb" data-lb>' . $im . '</a>'
                    : '<div>' . $im . '</div>';
            }
            if ($items === '' && $editor) $items = '<div class="ph">Adicione imagens à galeria</div>';
            $inner = '<div class="gal">' . $items . '</div>';
            break;

        case 'list':
            $css->rule("$sel li", 'font-size', $p['size'] ?? '', 'f_len');
            $css->rule("$sel li", 'color', $p['color'] ?? '', 'f_color');
            $css->rule("$sel .li-i", 'color', $p['iconColor'] ?? '', 'f_color');
            $li = '';
            foreach (($p['items'] ?? []) as $it) {
                $ic = (string)($it['icon'] ?? '') ?: (string)($p['icon'] ?? '');
                $li .= '<li>' . ($ic !== '' && !preg_match('/^[a-z0-9 -]+$/i', $ic) ? '<span class="li-i">' . esc($ic) . '</span>' : ($ic !== '' ? icon_html($ic, 'li-i') : '')) . '<span>' . ($it['html'] ?? esc($it['text'] ?? '')) . '</span></li>';
            }
            $inner = '<ul class="ul">' . $li . '</ul>';
            break;

        case 'social':
            $css->rule("$sel a", 'color', $p['color'] ?? '', 'f_color');
            $css->rule("$sel a", 'background-color', $p['bg'] ?? '', 'f_color');
            $css->rule("$sel a", 'width', $p['size'] ?? '44', 'f_len');
            $css->rule("$sel a", 'height', $p['size'] ?? '44', 'f_len');
            if (($p['shape'] ?? 'circle') === 'square') $css->raw('d', "$sel a", 'border-radius:10px');
            $li = '';
            foreach (($p['items'] ?? []) as $it) {
                $u = safe_url($it['url'] ?? '');
                if ($u === '') continue;
                $li .= '<a href="' . esc($u) . '" target="_blank" rel="noopener noreferrer" aria-label="' . esc($it['label'] ?? 'Rede social') . '">' . icon_html((string)($it['icon'] ?? 'fa-solid fa-link')) . '</a>';
            }
            $inner = '<div class="soc">' . $li . '</div>';
            break;

        case 'accordion':
            $css->rule("$sel summary", 'color', $p['color'] ?? '', 'f_color');
            $li = '';
            foreach (($p['items'] ?? []) as $i => $it) {
                $li .= '<details' . ($i === 0 && !empty($p['open']) ? ' open' : '') . '><summary>' . esc($it['q'] ?? '') . '</summary><div class="rich">' . ($it['a'] ?? '') . '</div></details>';
            }
            $inner = '<div class="acc">' . $li . '</div>';
            break;

        default:
            return '';
    }
    $cls = "w w-$type e-$id";
    return '<div class="' . $cls . '" data-wid="' . $id . '"' . anim_attrs($p) . '>' . $inner . '</div>';
}

/* ---------- colunas / seções ---------- */

function render_column(array $c, Css $css, bool $editor): string
{
    $id = preg_replace('/[^a-z0-9_-]/i', '', (string)($c['id'] ?? uid('c')));
    $s = $c['s'] ?? [];
    $sel = ".e-$id";
    $css->rule($sel, 'width', $s['span'] ?? ['d' => 12], function ($n) {
        $n = max(1, min(12, (int)$n));
        return $n === 12 ? '100%' : 'calc((100% - 11 * var(--g)) / 12 * ' . $n . ' + ' . ($n - 1) . ' * var(--g) - .5px)';
    });
    $css->rule($sel, 'text-align', $s['align'] ?? '', 'f_align');
    $css->rule($sel, 'padding', $s['pad'] ?? '', 'css_lenlist');
    $css->rule($sel, 'background-color', $s['bg'] ?? '', 'f_color');
    $css->rule($sel, 'order', $s['order'] ?? '', fn($n) => is_numeric($n) ? (string)(int)$n : '');
    $css->rule($sel, 'justify-content', $s['vAlign'] ?? '', fn($v) => ['start' => 'flex-start', 'center' => 'center', 'end' => 'flex-end', 'between' => 'space-between'][$v] ?? '');
    $css->rule($sel, 'gap', $s['gap'] ?? '', 'f_len');
    if (!empty($s['radius']) && css_lenlist($s['radius']) !== '') $css->raw('d', $sel, 'border-radius:' . css_lenlist($s['radius']));
    foreach (rv($s['hide'] ?? []) as $dev => $h) if ($h) $css->hide($dev, $sel);
    $html = '';
    foreach (($c['widgets'] ?? []) as $w) $html .= render_widget($w, $css, $editor);
    if ($html === '' && $editor) $html = '<div class="ph">Coluna vazia — adicione elementos</div>';
    return '<div class="col e-' . $id . '" data-cid="' . $id . '"' . anim_attrs($s) . '>' . $html . '</div>';
}

function render_section(array $sec, Css $css, bool $editor): string
{
    $id = preg_replace('/[^a-z0-9_-]/i', '', (string)($sec['id'] ?? uid('s')));
    $s = $sec['s'] ?? [];
    $sel = ".e-$id";
    $css->rule($sel, 'background-color', $s['bg'] ?? '', 'f_color');
    $css->rule($sel, 'color', $s['color'] ?? '', 'f_color');
    $css->rule("$sel .sec-in", 'padding-top', $s['padT'] ?? '', 'f_len');
    $css->rule("$sel .sec-in", 'padding-bottom', $s['padB'] ?? '', 'f_len');
    $css->rule("$sel .sec-in", 'padding-left', $s['padX'] ?? '', 'f_len');
    $css->rule("$sel .sec-in", 'padding-right', $s['padX'] ?? '', 'f_len');
    $css->rule("$sel .sec-in", 'max-width', $s['maxw'] ?? '', 'f_len');
    $css->rule("$sel .sec-row", '--g', $s['gap'] ?? '', 'f_len');
    $css->rule("$sel .sec-row", 'align-items', $s['vAlign'] ?? '', fn($v) => ['start' => 'start', 'center' => 'center', 'end' => 'end', 'stretch' => 'stretch'][$v] ?? '');
    $css->rule($sel, 'min-height', $s['minH'] ?? '', fn($v) => $v === 'screen' ? '100vh;min-height:100svh' : css_len($v));
    if (!empty($s['minH']) && (rv($s['minH'])['d'] ?? '') !== '') $css->raw('d', $sel, 'display:flex;flex-direction:column;justify-content:' . (['start' => 'flex-start', 'center' => 'center', 'end' => 'flex-end'][$s['contentV'] ?? 'center'] ?? 'center'));
    foreach (rv($s['hide'] ?? []) as $dev => $h) if ($h) $css->hide($dev, $sel);

    $bg = '';
    $bgs = "$sel .sec-bg";
    $css->rule($bgs, 'background-image', $s['bgImage'] ?? '', function ($v) {
        $u = asset_url((string)$v);
        return $u === '' ? '' : "url('" . str_replace(["'", '\\', ')', '(', '"', ' '], ['%27', '', '%29', '%28', '%22', '%20'], $u) . "')";
    });
    $css->rule($bgs, '--bx', $s['bgX'] ?? '', fn($v) => css_num($v, -100, 200) !== '' ? css_num($v, -100, 200) . '%' : '');
    $css->rule($bgs, '--by', $s['bgY'] ?? '', fn($v) => css_num($v, -100, 200) !== '' ? css_num($v, -100, 200) . '%' : '');
    if (empty($s['bgX']) && empty($s['bgY']) && !empty($s['bgPos']) && preg_match('/^(\d{1,3}%|center|top|bottom|left|right)( (\d{1,3}%|center|top|bottom|left|right))?$/', (string)$s['bgPos'])) $css->raw('d', $bgs, 'background-position:' . $s['bgPos']);
    if (($s['bgFit'] ?? 'cover') === 'contain') $css->raw('d', $bgs, 'background-size:contain');
    if (($s['bgFit'] ?? 'cover') === 'custom') $css->rule($bgs, 'background-size', $s['bgW'] ?? '', fn($v) => css_num($v, 10, 600) !== '' ? css_num($v, 10, 600) . '%' : '');
    foreach (rv($s['bgHide'] ?? []) as $dev => $h) if ($h) { $css->hide($dev, "$sel .sec-bg"); $css->hide($dev, "$sel .sec-ov"); }
    $hasImg = array_filter(rv($s['bgImage'] ?? ''), fn($v) => $v !== '');
    if ($hasImg || !empty($s['overlay'])) {
        $bg = '<div class="sec-bg' . (!empty($s['parallax']) ? ' plx' : '') . '"></div>';
        $css->rule("$sel .sec-ov", 'background', $s['overlay'] ?? '', 'f_color');
        if (!empty($s['overlay'])) $bg .= '<div class="sec-ov"></div>';
    }
    $cols = '';
    foreach (($sec['columns'] ?? []) as $c) $cols .= render_column($c, $css, $editor);
    $anchor = preg_replace('/[^a-z0-9_-]/i', '', (string)($sec['anchor'] ?? ''));
    $snap = ($s['snap'] ?? true) === false ? ' data-nosnap' : '';
    return '<section' . ($anchor !== '' ? ' id="' . $anchor . '"' : '') . ' class="sec e-' . $id . '" data-sid="' . $id . '" data-label="' . esc($sec['label'] ?? '') . '"' . $snap . '>'
        . $bg . '<div class="sec-in"><div class="sec-row">' . $cols . '</div></div></section>';
}

function sections_html(array $site, Css $css, bool $editor): string
{
    $h = '';
    foreach (($site['sections'] ?? []) as $sec) {
        if (!empty($sec['disabled']) && !$editor) continue;
        $h .= render_section($sec, $css, $editor);
    }
    return $h;
}

function header_html(array $site, Css $css): string
{
    $hd = $site['settings']['header'] ?? [];
    if (empty($hd['enabled'])) return '';
    $css->rule('#hdr', 'color', $hd['color'] ?? '', 'f_color');
    $css->rule('#hdr', 'background-color', $hd['bg'] ?? '', 'f_color');
    $css->rule('#hdr.solid', 'background-color', $hd['solidBg'] ?? '#ffffff', 'f_color');
    $css->rule('#hdr .logo img', 'height', $hd['logoH'] ?? '46', 'f_len');
    $css->rule('#hdr .nav a', 'color', $hd['color'] ?? '', 'f_color');
    $css->raw('d', '#hdr.solid .nav a', 'color:' . (css_color($hd['solidColor'] ?? '#5f5e5c') ?: '#5f5e5c'));
    $items = [];
    foreach (($hd['menu'] ?? []) as $m) {
        $u = safe_url($m['url'] ?? '');
        if ($u !== '' && ($m['label'] ?? '') !== '') $items[] = [$m['label'], $u];
    }
    if (($hd['menuMode'] ?? 'auto') === 'auto') {
        $items = [];
        foreach (($site['sections'] ?? []) as $sec) {
            if (!empty($sec['menu']) && !empty($sec['anchor']) && empty($sec['disabled'])) $items[] = [$sec['menu'], '#' . $sec['anchor']];
        }
    }
    $nav = '';
    foreach ($items as [$l, $u]) $nav .= '<a href="' . esc($u) . '">' . esc($l) . '</a>';
    $btn = '';
    if (!empty($hd['btnText'])) {
        $btn = '<a class="btn btn-solid btn-sm" href="' . esc(safe_url($hd['btnUrl'] ?? '') ?: '#') . '" target="_blank" rel="noopener">' . icon_html((string)($hd['btnIcon'] ?? ''), 'bi') . '<span>' . esc($hd['btnText']) . '</span></a>';
    }
    $logo = !empty($hd['logo']) ? '<a href="#top" class="logo">' . img_tag((string)$hd['logo'], 'Logo', '', '', false) . '</a>' : '<span></span>';
    return '<header id="hdr" class="' . (!empty($hd['solidOnScroll']) ? 'sos' : '') . (!empty($hd['logoOnScroll']) ? ' lh' : '') . (!empty($hd['hideAtTop']) ? ' hat' : '') . '" data-hdr>'
        . '<div class="hdr-in">' . $logo . '<nav class="nav" id="nav">' . $nav . $btn . '</nav>'
        . '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button></div></header>';
}

function global_css(array $site): string
{
    $st = $site['settings'] ?? [];
    $c = $st['colors'] ?? [];
    $def = ['primary' => '#d48a67', 'dark' => '#5f5e5c', 'cream' => '#fffaf4', 'cream2' => '#fcf6ef', 'text' => '#5f5e5c', 'light' => '#ffffff'];
    $vars = '';
    foreach ($def as $k => $v) $vars .= '--c-' . $k . ':' . (css_color($c[$k] ?? '') ?: $v) . ';';
    $f = fn($n, $d) => preg_match('/^[A-Za-z0-9 ]{2,40}$/', (string)$n) ? $n : $d;
    $fb = $f($st['fonts']['body'] ?? '', 'Nunito Sans');
    $fh = $f($st['fonts']['heading'] ?? '', 'Playfair Display');
    $fs = $f($st['fonts']['script'] ?? '', 'Great Vibes');
    $vars .= "--f-body:'$fb',system-ui,sans-serif;--f-head:'$fh',system-ui,sans-serif;--f-script:'$fs',cursive;";
    return ":root{" . $vars . "}";
}

function fonts_link(array $site): string
{
    $st = $site['settings']['fonts'] ?? [];
    $names = array_unique(array_filter([$st['body'] ?? 'Nunito Sans', $st['heading'] ?? 'Playfair Display', $st['script'] ?? 'Great Vibes'], fn($n) => preg_match('/^[A-Za-z0-9 ]{2,40}$/', (string)$n)));
    // Fontes de peso único não aceitam eixo de peso na URL do Google Fonts
    $single = ['Great Vibes', 'Pacifico', 'Dancing Script', 'Allura', 'Satisfy', 'Sacramento', 'DM Serif Display', 'Abril Fatface'];
    $q = '';
    foreach ($names as $n) {
        $q .= '&family=' . str_replace(' ', '+', $n) . (in_array($n, $single, true) ? '' : ':wght@400;500;600;700');
    }
    return 'https://fonts.googleapis.com/css2?' . ltrim($q, '&') . '&display=swap';
}

/** Renderiza o conteúdo (usado pelo site e pelo preview do editor) */
function render_content(array $site, bool $editor = false): array
{
    $css = new Css();
    $body = header_html($site, $css) . '<main id="top">' . sections_html($site, $css, $editor) . '</main>';
    return ['css' => global_css($site) . $css->out(), 'html' => $body];
}

function head_extra(array $site): string
{
    $st = $site['settings'] ?? [];
    $title = esc($st['title'] ?? 'Site');
    $desc = esc($st['description'] ?? '');
    $img = !empty($st['ogImage']) ? full_origin() . asset_url($st['ogImage']) : '';
    $h = "<title>$title</title>\n<meta name=\"description\" content=\"$desc\">\n";
    $h .= "<meta property=\"og:title\" content=\"$title\">\n<meta property=\"og:description\" content=\"$desc\">\n<meta property=\"og:type\" content=\"website\">\n";
    if ($img) $h .= "<meta property=\"og:image\" content=\"" . esc($img) . "\">\n";
    if (!empty($st['favicon'])) $h .= '<link rel="icon" href="' . esc(asset_url($st['favicon'])) . "\">\n";
    if (!empty($st['themeColor']) && css_color($st['themeColor'])) $h .= '<meta name="theme-color" content="' . esc(css_color($st['themeColor'])) . "\">\n";
    return $h;
}

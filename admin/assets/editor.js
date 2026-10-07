/* Editor visual do site — JS puro, sem build. Edita data/site.json via admin/api.php */
(function () {
  'use strict';
  var CFG = window.CFG, BASE = CFG.base;

  /* ---------- utilidades ---------- */
  function el(tag, props) {
    var e = document.createElement(tag);
    props = props || {};
    for (var k in props) {
      var v = props[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'icon') e.innerHTML = '<i class="' + v + '"></i>';
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) append(e, arguments[i]);
    return e;
  }
  function append(e, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { append(e, x); });
    else e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  function uid(p) { return p + Math.random().toString(36).slice(2, 9); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function strip(h) { var d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').trim(); }
  function slug(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function toast(msg, err) {
    var t = el('div', { class: 'toast' + (err ? ' err' : ''), text: msg }); document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, err ? 5000 : 2200);
  }
  function api(action, o) {
    o = o || {};
    var opt = { method: o.body || o.form ? 'POST' : 'GET', headers: { 'X-CSRF': CFG.csrf }, credentials: 'same-origin' };
    if (o.body) { opt.body = JSON.stringify(o.body); opt.headers['Content-Type'] = 'application/json'; }
    if (o.form) opt.body = o.form;
    return fetch(BASE + '/admin/api.php?action=' + action, opt).then(function (r) {
      return r.json().catch(function () { return { error: 'Resposta inválida do servidor' }; }).then(function (j) {
        if (r.status === 401) { alert('Sua sessão expirou. Salve uma cópia e faça login novamente.'); }
        if (j.error) throw new Error(j.error);
        return j;
      });
    });
  }
  function get(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function set(o, path, v) {
    var ks = path.split('.'), last = ks.pop(), c = o;
    ks.forEach(function (k) { if (typeof c[k] !== 'object' || c[k] === null) c[k] = {}; c = c[k]; });
    if (v === '' || v === undefined) delete c[last]; else c[last] = v;
  }

  /* ---------- catálogo ---------- */
  var WT = {
    heading: ['fa-solid fa-heading', 'Título'], text: ['fa-solid fa-align-left', 'Texto'], image: ['fa-regular fa-image', 'Imagem'],
    button: ['fa-solid fa-computer-mouse', 'Botão'], iconbox: ['fa-solid fa-shapes', 'Caixa de ícone'], gallery: ['fa-solid fa-images', 'Galeria'],
    list: ['fa-solid fa-list-ul', 'Lista'], video: ['fa-brands fa-youtube', 'Vídeo'], social: ['fa-solid fa-share-nodes', 'Redes sociais'],
    accordion: ['fa-solid fa-bars-staggered', 'Sanfona (FAQ)'], spacer: ['fa-solid fa-arrows-up-down', 'Espaçador'], divider: ['fa-solid fa-minus', 'Divisor'],
    html: ['fa-solid fa-code', 'HTML livre']
  };
  var DEFAULTS = {
    heading: { html: 'Novo título', tag: 'h2' }, text: { html: '<p>Escreva seu texto aqui.</p>' }, image: { src: '', alt: '', w: '100%' },
    button: { text: 'Saiba mais', url: '#', variant: 'solid' }, iconbox: { icon: 'fa-solid fa-heart', title: 'Título', text: '', iconBg: '#fffaf4', iconColor: '#d48a67' },
    gallery: { items: [], cols: { d: 3, t: 2, m: 1 }, gap: '16', lightbox: true }, list: { icon: 'fa-solid fa-check', items: [{ text: 'Item da lista' }] },
    video: { url: '' }, social: { items: [{ icon: 'fa-brands fa-instagram', url: '', label: 'Instagram' }], size: '44' },
    accordion: { items: [{ q: 'Pergunta', a: '<p>Resposta</p>' }], open: true }, spacer: { h: '40' }, divider: {}, html: { code: '<p>Seu HTML aqui</p>' }
  };
  var ANIMS = [['', 'Nenhuma'], ['fade-up', 'Subir suave'], ['fade-in', 'Aparecer'], ['fade-down', 'Descer suave'], ['fade-left', 'Da esquerda'], ['fade-right', 'Da direita'], ['zoom-in', 'Zoom'], ['slide-up', 'Subir longo']];
  var FONTS = ['Playfair Display', 'Cormorant Garamond', 'Lora', 'Libre Baskerville', 'Merriweather', 'DM Serif Display', 'Nunito Sans', 'Nunito', 'Lato', 'DM Sans', 'Raleway', 'Montserrat', 'Poppins', 'Open Sans', 'Inter', 'Roboto', 'Great Vibes', 'Dancing Script', 'Allura'];
  var ICONS = ['fa-brands fa-whatsapp', 'fa-brands fa-instagram', 'fa-brands fa-facebook-f', 'fa-brands fa-linkedin-in', 'fa-brands fa-youtube', 'fa-brands fa-tiktok', 'fa-solid fa-envelope', 'fa-solid fa-phone', 'fa-regular fa-calendar-check', 'fa-regular fa-hand-point-right', 'fa-solid fa-heart', 'fa-solid fa-star', 'fa-solid fa-check', 'fa-solid fa-arrow-right', 'fa-solid fa-brain', 'fa-solid fa-user', 'fa-solid fa-users', 'fa-solid fa-book-open', 'fa-solid fa-hands-holding-child', 'fa-solid fa-puzzle-piece', 'fa-solid fa-leaf', 'fa-solid fa-location-dot', 'fa-solid fa-link', 'fa-solid fa-diamond'];
  var PRESETS = [[12], [6, 6], [4, 8], [8, 4], [4, 4, 4], [3, 3, 3, 3]];

  var ALIGN = [['left', '<i class="fa-solid fa-align-left"></i>'], ['center', '<i class="fa-solid fa-align-center"></i>'], ['right', '<i class="fa-solid fa-align-right"></i>']];

  /* esquemas dos campos: t=tipo, k=caminho, l=rótulo, r=responsivo */
  var ADV = { g: 'Avançado', open: false, f: [
    { t: 'seg', k: 'p.align', l: 'Alinhamento', r: 1, o: ALIGN }, { t: 'num', k: 'p.mt', l: 'Espaço acima (px)', r: 1 }, { t: 'num', k: 'p.mb', l: 'Espaço abaixo (px)', r: 1 },
    { t: 'txt', k: 'p.maxw', l: 'Largura máxima (ex.: 480px ou 60%)', r: 1 }, { t: 'hide', k: 'p.hide', l: 'Ocultar em' },
    { t: 'sel', k: 'p.anim', l: 'Animação ao aparecer', o: ANIMS }, { t: 'num', k: 'p.delay', l: 'Atraso da animação (ms)' } ] };
  var SIZE = { t: 'num', k: 'p.size', l: 'Tamanho da fonte (px)', r: 1 };
  var SCHEMA = {
    heading: [{ g: 'Conteúdo', open: true, f: [{ t: 'rich', k: 'p.html', l: 'Texto', min: 1 }, { t: 'sel', k: 'p.tag', l: 'Nível (SEO)', o: [['h1', 'H1 (principal)'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['p', 'Parágrafo']] }] },
      { g: 'Estilo', open: true, f: [SIZE, { t: 'color', k: 'p.color', l: 'Cor' }, { t: 'sel', k: 'p.weight', l: 'Peso', o: [['', 'Padrão'], ['300', 'Leve'], ['500', 'Médio'], ['600', 'Semi-negrito'], ['700', 'Negrito'], ['800', 'Extra-negrito']] }, { t: 'sel', k: 'p.family', l: 'Fonte', o: [['', 'Título'], ['script', 'Cursiva (assinatura)']] }, { t: 'tog', k: 'p.italic', l: 'Itálico' }, { t: 'tog', k: 'p.upper', l: 'Maiúsculas' }, { t: 'num', k: 'p.lh', l: 'Altura da linha (ex.: 1.2)' }] }, ADV],
    text: [{ g: 'Conteúdo', open: true, f: [{ t: 'rich', k: 'p.html', l: 'Texto' }] }, { g: 'Estilo', open: false, f: [SIZE, { t: 'color', k: 'p.color', l: 'Cor' }, { t: 'num', k: 'p.lh', l: 'Altura da linha (ex.: 1.7)' }] }, ADV],
    image: [{ g: 'Imagem', open: true, f: [{ t: 'img', k: 'p.src', l: 'Imagem' }, { t: 'txt', k: 'p.alt', l: 'Texto alternativo (SEO)' }, { t: 'txt', k: 'p.link', l: 'Link ao clicar (opcional)' }] },
      { g: 'Tamanho e enquadramento', open: true, f: [
        { t: 'tog', k: 'p.fill', l: 'Acompanhar a altura do texto ao lado (computador)' },
        { t: 'txt', k: 'p.w', l: 'Largura (ex.: 100%, 420px)', r: 1 }, { t: 'txt', k: 'p.h', l: 'Altura (ex.: 480px)', r: 1 },
        { t: 'sel', k: 'p.ratio', l: 'Proporção', r: 1, o: [['', 'Original'], ['1/1', '1:1 quadrada'], ['4/5', '4:5 retrato'], ['3/4', '3:4 retrato'], ['2/3', '2:3 retrato'], ['4/3', '4:3 paisagem'], ['3/2', '3:2 paisagem'], ['16/9', '16:9 panorâmica'], ['21/9', '21:9 cinema']] },
        { t: 'txt', k: 'p.maxh', l: 'Altura máx. (ex.: 70svh, 560px) — mantém a proporção', r: 1 },
        { t: 'sel', k: 'p.fit', l: 'Encaixe', o: [['', 'Preencher (corta)'], ['contain', 'Mostrar inteira'], ['fill', 'Esticar']] },
        { t: 'focal', kx: 'p.objX', ky: 'p.objY', src: 'p.src', l: 'Ponto de foco — clique ou arraste na imagem', r: 1 },
        { t: 'range', k: 'p.zoom', l: 'Zoom (%)', min: 50, max: 300, def: 100, r: 1 }, { t: 'range', k: 'p.objX', l: 'Posição horizontal (%)', min: 0, max: 100, def: 50, r: 1 }, { t: 'range', k: 'p.objY', l: 'Posição vertical (%)', min: 0, max: 100, def: 50, r: 1 }] },
      { g: 'Forma e estilo', open: true, f: [{ t: 'corners', k: 'p.radius', l: 'Forma — cantos arredondados' }, { t: 'tog', k: 'p.shadow', l: 'Sombra' }, { t: 'tog', k: 'p.hover', l: 'Zoom ao passar o mouse' }, { t: 'tog', k: 'p.invert', l: 'Tornar branca (logos escuras)' }] }, ADV],
    button: [{ g: 'Botão', open: true, f: [{ t: 'txt', k: 'p.text', l: 'Texto' }, { t: 'txt', k: 'p.url', l: 'Link (https://…, #secao, tel:…)' }, { t: 'icon', k: 'p.icon', l: 'Ícone' }, { t: 'seg', k: 'p.iconPos', l: 'Posição do ícone', o: [['left', 'Esquerda'], ['right', 'Direita']] }, { t: 'tog', k: 'p.newtab', l: 'Abrir em nova aba' }] },
      { g: 'Estilo', open: true, f: [{ t: 'seg', k: 'p.variant', l: 'Tipo', o: [['solid', 'Cheio'], ['outline', 'Contorno'], ['ghost', 'Texto']] }, { t: 'color', k: 'p.bg', l: 'Cor de fundo' }, { t: 'color', k: 'p.color', l: 'Cor do texto' }, SIZE, { t: 'txt', k: 'p.radius', l: 'Arredondamento (ex.: 8px, 999px)' }, { t: 'tog', k: 'p.full', l: 'Largura total' }] }, ADV],
    iconbox: [{ g: 'Conteúdo', open: true, f: [{ t: 'img', k: 'p.img', l: 'Ícone em imagem/SVG (opcional)' }, { t: 'icon', k: 'p.icon', l: 'ou ícone Font Awesome' }, { t: 'txt', k: 'p.title', l: 'Título' }, { t: 'area', k: 'p.text', l: 'Descrição' }] },
      { g: 'Estilo', open: true, f: [{ t: 'color', k: 'p.iconBg', l: 'Fundo do ícone' }, { t: 'color', k: 'p.iconColor', l: 'Cor do ícone' }, { t: 'num', k: 'p.iconBox', l: 'Tamanho do círculo (px)', r: 1 }, { t: 'num', k: 'p.iconSize', l: 'Tamanho do ícone (px)', r: 1 }, { t: 'num', k: 'p.size', l: 'Fonte do título (px)', r: 1 }, { t: 'color', k: 'p.color', l: 'Cor do título' }] }, ADV],
    spacer: [{ g: 'Espaçador', open: true, f: [{ t: 'num', k: 'p.h', l: 'Altura (px)', r: 1 }] }, { g: 'Avançado', f: [{ t: 'hide', k: 'p.hide', l: 'Ocultar em' }] }],
    divider: [{ g: 'Divisor', open: true, f: [{ t: 'color', k: 'p.color', l: 'Cor' }, { t: 'txt', k: 'p.w', l: 'Largura (ex.: 80px, 100%)' }, { t: 'num', k: 'p.th', l: 'Espessura (px)' }] }, ADV],
    html: [{ g: 'HTML', open: true, f: [{ t: 'code', k: 'p.code', l: 'Código HTML (mapas, formulários, embeds)' }] }, ADV],
    video: [{ g: 'Vídeo', open: true, f: [{ t: 'txt', k: 'p.url', l: 'Link do YouTube/Vimeo ou arquivo .mp4' }, { t: 'sel', k: 'p.ratio', l: 'Proporção', o: [['16/9', '16:9'], ['4/3', '4:3'], ['1/1', 'Quadrado'], ['9/16', 'Vertical']] }] }, ADV],
    gallery: [{ g: 'Imagens', open: true, f: [{ t: 'gal', k: 'p.items', l: 'Imagens' }] },
      { g: 'Estilo', open: true, f: [{ t: 'num', k: 'p.cols', l: 'Colunas', r: 1 }, { t: 'num', k: 'p.gap', l: 'Espaço entre imagens (px)' }, { t: 'corners', k: 'p.radius', l: 'Forma das imagens' }, { t: 'sel', k: 'p.ratio', l: 'Proporção', o: [['', 'Original'], ['1/1', 'Quadrada'], ['4/3', '4:3'], ['3/4', '3:4']] }, { t: 'tog', k: 'p.slider', l: 'Carrossel (uma linha com setas)' }, { t: 'tog', k: 'p.lightbox', l: 'Ampliar ao clicar' }] }, ADV],
    list: [{ g: 'Itens', open: true, f: [{ t: 'icon', k: 'p.icon', l: 'Ícone padrão (ou emoji)' }, { t: 'num', k: 'p.cols', l: 'Colunas da lista', r: 1 }, { t: 'rep', k: 'p.items', l: 'Itens', add: { text: 'Novo item' }, sub: [{ t: 'txt', k: 'text', l: 'Texto' }], title: 'text' }] },
      { g: 'Estilo', open: false, f: [SIZE, { t: 'color', k: 'p.color', l: 'Cor do texto' }, { t: 'color', k: 'p.iconColor', l: 'Cor do ícone' }] }, ADV],
    social: [{ g: 'Redes', open: true, f: [{ t: 'rep', k: 'p.items', l: 'Redes sociais', add: { icon: 'fa-brands fa-instagram', url: '', label: 'Rede' }, sub: [{ t: 'icon', k: 'icon', l: 'Ícone' }, { t: 'txt', k: 'url', l: 'Link' }, { t: 'txt', k: 'label', l: 'Nome (acessibilidade)' }], title: 'label' }] },
      { g: 'Estilo', open: true, f: [{ t: 'color', k: 'p.bg', l: 'Fundo' }, { t: 'color', k: 'p.color', l: 'Cor do ícone' }, { t: 'num', k: 'p.size', l: 'Tamanho (px)' }, { t: 'seg', k: 'p.shape', l: 'Formato', o: [['circle', 'Redondo'], ['square', 'Quadrado']] }] }, ADV],
    accordion: [{ g: 'Perguntas', open: true, f: [{ t: 'rep', k: 'p.items', l: 'Itens', add: { q: 'Nova pergunta', a: '<p>Resposta</p>' }, sub: [{ t: 'txt', k: 'q', l: 'Pergunta' }, { t: 'rich', k: 'a', l: 'Resposta' }], title: 'q' }, { t: 'tog', k: 'p.open', l: 'Primeiro item aberto' }] }, { g: 'Estilo', f: [{ t: 'color', k: 'p.color', l: 'Cor da pergunta' }] }, ADV]
  };
  var VAL = [['', 'Padrão'], ['start', 'Topo'], ['center', 'Centro'], ['end', 'Base']];
  var COLUMN_SCHEMA = [
    { g: 'Layout', open: true, f: [{ t: 'span', k: 's.span', l: 'Largura (de 12)', r: 1 }, { t: 'seg', k: 's.align', l: 'Alinhamento do conteúdo', r: 1, o: ALIGN }, { t: 'sel', k: 's.vAlign', l: 'Alinhamento vertical', o: VAL.concat([['between', 'Distribuir']]) }, { t: 'num', k: 's.order', l: 'Ordem (use no celular para inverter)', r: 1 }, { t: 'num', k: 's.gap', l: 'Espaço entre elementos (px)', r: 1 }] },
    { g: 'Estilo', open: false, f: [{ t: 'color', k: 's.bg', l: 'Fundo', r: 1 }, { t: 'txt', k: 's.pad', l: 'Espaçamento interno (ex.: 24px ou 20px 30px)', r: 1 }, { t: 'txt', k: 's.radius', l: 'Cantos arredondados' }, { t: 'hide', k: 's.hide', l: 'Ocultar em' }, { t: 'sel', k: 's.anim', l: 'Animação', o: ANIMS }, { t: 'num', k: 's.delay', l: 'Atraso (ms)' }] }
  ];
  var SECTION_SCHEMA = [
    { g: 'Geral', open: true, f: [{ t: 'txt', k: 'label', l: 'Nome da seção (só para você)' }, { t: 'anchor', k: 'anchor', l: 'Âncora (link #…)' }, { t: 'txt', k: 'menu', l: 'Texto no menu (vazio = não aparece)' }, { t: 'tog', k: 'disabled', l: 'Ocultar seção do site' }, { t: 'tog', k: 's.snap', l: 'Incluir no auto-scroll por seção', def: true }, { t: 'tog', k: 's.fit', l: 'Reduzir texto para caber na tela (se necessário)' }] },
    { g: 'Fundo', open: true, f: [{ t: 'color', k: 's.bg', l: 'Cor de fundo', r: 1 }, { t: 'img', k: 's.bgImage', l: 'Imagem de fundo (por dispositivo)', r: 1 },
      { t: 'seg', k: 's.bgFit', l: 'Ajuste da imagem', o: [['cover', 'Cobrir'], ['contain', 'Conter'], ['custom', 'Zoom']] }, { t: 'range', k: 's.bgW', l: 'Tamanho (%) — modo Zoom', min: 50, max: 400, def: 100, r: 1 },
      { t: 'focal', kx: 's.bgX', ky: 's.bgY', src: 's.bgImage', l: 'Ponto de foco do fundo', r: 1 }, { t: 'color', k: 's.fade.c', l: 'Degradê: cor que mescla com a foto (use a cor de fundo)' }, { t: 'sel', k: 's.fade.dir', l: 'Degradê: lado onde a cor domina', o: [['90deg', 'Direita'], ['270deg', 'Esquerda'], ['180deg', 'Embaixo'], ['0deg', 'Em cima']] },
      { t: 'range', k: 's.fade.from', l: 'Degradê: começa em (%)', min: 0, max: 100, def: 35 }, { t: 'range', k: 's.fade.to', l: 'Degradê: cor total em (%)', min: 0, max: 100, def: 65 }, { t: 'hide', k: 's.bgHide', l: 'Ocultar imagem de fundo em' },
      { t: 'tog', k: 's.parallax', l: 'Efeito parallax (desktop)' }, { t: 'color', k: 's.overlay', l: 'Camada de cor sobre a imagem' }, { t: 'color', k: 's.color', l: 'Cor padrão do texto' }] },
    { g: 'Tamanho e espaçamento', open: true, f: [{ t: 'sel', k: 's.minH', l: 'Altura', o: [['', 'Tela inteira (padrão)'], ['auto', 'Só a altura do conteúdo'], ['70vh', '70% da tela'], ['500px', '500px']], r: 1 }, { t: 'sel', k: 's.contentV', l: 'Conteúdo na vertical', o: [['center', 'Centro'], ['start', 'Topo'], ['end', 'Base']] }, { t: 'num', k: 's.padT', l: 'Espaço interno acima (px)', r: 1 }, { t: 'num', k: 's.padB', l: 'Espaço interno abaixo (px)', r: 1 }, { t: 'num', k: 's.padX', l: 'Margem lateral (px)', r: 1 }, { t: 'txt', k: 's.maxw', l: 'Largura máxima do conteúdo (ex.: 1180px)', r: 1 }, { t: 'num', k: 's.gap', l: 'Espaço entre colunas (px)', r: 1 }, { t: 'sel', k: 's.vAlign', l: 'Alinhar colunas', o: [['', 'Padrão'], ['start', 'Topo'], ['center', 'Centro'], ['end', 'Base'], ['stretch', 'Esticar']] }, { t: 'hide', k: 's.hide', l: 'Ocultar em' }] }
  ];

  /* ---------- estado ---------- */
  var S = { site: null, sel: null, tab: 'structure', dev: 'd', dirty: false, hist: [], hi: -1, ready: false };
  var app, side, pane, frameBox, iframe, tabsEl, btnSave, btnUndo, btnRedo;

  /* ---------- modelo ---------- */
  function findNode(id) {
    var secs = S.site.sections;
    for (var i = 0; i < secs.length; i++) {
      var s = secs[i];
      if (s.id === id) return { kind: 'section', node: s, list: secs, idx: i, sec: s };
      for (var j = 0; j < s.columns.length; j++) {
        var c = s.columns[j];
        if (c.id === id) return { kind: 'column', node: c, list: s.columns, idx: j, sec: s, parent: s };
        for (var k = 0; k < c.widgets.length; k++) {
          if (c.widgets[k].id === id) return { kind: 'widget', node: c.widgets[k], list: c.widgets, idx: k, sec: s, col: c, parent: c };
        }
      }
    }
    return null;
  }
  function reid(n, kind) {
    n.id = uid(kind === 'section' ? 's' : kind === 'column' ? 'c' : 'w');
    if (kind === 'section') n.columns.forEach(function (c) { reid(c, 'column'); });
    if (kind === 'column') n.widgets.forEach(function (w) { reid(w, 'widget'); });
    return n;
  }
  function newColumn(span) { return { id: uid('c'), s: { span: { d: span, t: 12, m: 12 } }, widgets: [] }; }
  function newSection(preset) {
    var id = uid('s');
    return { id: id, label: 'Nova seção', anchor: 'secao-' + id.slice(1, 5), menu: '', s: { bg: '#FFFAF4', padT: '80', padB: '80', snap: true }, columns: preset.map(newColumn) };
  }
  function newWidget(type) { return { id: uid('w'), type: type, p: clone(DEFAULTS[type] || {}) }; }

  /* ---------- histórico / salvar ---------- */
  function snap() {
    var j = JSON.stringify(S.site);
    if (S.hist[S.hi] === j) return;
    S.hist = S.hist.slice(0, S.hi + 1); S.hist.push(j); if (S.hist.length > 60) S.hist.shift(); S.hi = S.hist.length - 1; updTop();
  }
  var snapD = debounce(snap, 500);
  function touch(structural) {
    S.dirty = true; updTop(); previewD(); snapD();
    if (structural) { renderTree(); }
  }
  function restoreHist(i) {
    if (i < 0 || i >= S.hist.length) return;
    S.hi = i; S.site = JSON.parse(S.hist[i]); S.dirty = true;
    if (S.sel && !findNode(S.sel.id)) S.sel = null;
    renderAll(); preview(); updTop();
  }
  function updTop() {
    if (!btnSave) return;
    btnSave.classList.toggle('dirty', S.dirty);
    btnUndo.disabled = S.hi <= 0; btnRedo.disabled = S.hi >= S.hist.length - 1;
  }
  function save() {
    btnSave.disabled = true;
    api('save', { body: S.site }).then(function (r) {
      S.site = r.site; S.dirty = false; S.hist = [JSON.stringify(S.site)]; S.hi = 0; updTop();
      toast('Salvo! O site já está atualizado.'); renderAll(); preview();
    }).catch(function (e) { toast(e.message, true); }).then(function () { btnSave.disabled = false; });
  }

  /* ---------- preview ---------- */
  function preview() {
    if (!S.ready) return;
    api('preview', { body: S.site }).then(function (r) {
      iframe.contentWindow.postMessage({ type: 'render', css: r.css, html: r.html }, '*');
      postSel(false);
    }).catch(function (e) { toast(e.message, true); });
  }
  var previewD = debounce(preview, 160);
  function postSel(scroll) {
    if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'select', sel: S.sel, scroll: scroll }, '*');
  }
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'ready') { S.ready = true; preview(); }
    if (d.type === 'select') { if (app.classList.contains('nopanel')) togglePanel(); select(d.sel, { tab: 'edit', noPost: true }); }
  });

  /* ---------- seleção ---------- */
  function select(sel, o) {
    o = o || {};
    S.sel = sel;
    if (o.tab) S.tab = o.tab;
    if (!o.noPost) postSel(true);
    renderTabs(); renderPane();
  }

  /* ---------- UI principal ---------- */
  function build() {
    app = document.getElementById('app'); app.innerHTML = '';
    btnUndo = el('button', { class: 'tb', icon: 'fa-solid fa-rotate-left', title: 'Desfazer (Ctrl+Z)', onclick: function () { snap(); restoreHist(S.hi - 1); } });
    btnRedo = el('button', { class: 'tb', icon: 'fa-solid fa-rotate-right', title: 'Refazer (Ctrl+Y)', onclick: function () { restoreHist(S.hi + 1); } });
    btnSave = el('button', { class: 'tb save', title: 'Salvar (Ctrl+S)', onclick: save }, el('i', { class: 'fa-solid fa-floppy-disk' }), el('span', { text: 'Salvar' }));
    var devs = el('div', { class: 'devs' });
    [['d', 'fa-solid fa-desktop', 'Desktop'], ['t', 'fa-solid fa-tablet-screen-button', 'Tablet'], ['m', 'fa-solid fa-mobile-screen', 'Celular']].forEach(function (x) {
      devs.appendChild(el('button', { class: 'tb' + (S.dev === x[0] ? ' on' : ''), 'data-d': x[0], icon: x[1], title: x[2], onclick: function () { S.dev = x[0]; frameBox.className = 'frame ' + x[0]; [].forEach.call(devs.children, function (b) { b.classList.toggle('on', b.dataset.d === x[0]); }); renderPane(); } }));
    });
    var togBtn = el('button', { class: 'tb', icon: 'fa-solid fa-table-columns', title: 'Mostrar/ocultar painel ( [ )', onclick: togglePanel });
    var top = el('div', { class: 'top' }, togBtn,
      devs, btnUndo, btnRedo, el('div', { class: 'sp' }),
      el('a', { class: 'tb', href: BASE + '/', target: '_blank', rel: 'noopener', title: 'Ver site publicado' }, el('i', { class: 'fa-solid fa-arrow-up-right-from-square' })),
      el('a', { class: 'tb', href: CFG.logout, title: 'Sair', onclick: function (e) { if (S.dirty && !confirm('Há alterações não salvas. Sair mesmo assim?')) e.preventDefault(); } }, el('i', { class: 'fa-solid fa-right-from-bracket' })),
      btnSave);
    tabsEl = el('div', { class: 'tabs' });
    pane = el('div', { class: 'pane' });
    side = el('div', { class: 'side' }, tabsEl, pane);
    iframe = el('iframe', { src: BASE + '/admin/preview.php', title: 'Pré-visualização' });
    frameBox = el('div', { class: 'frame ' + S.dev }, iframe);
    var rs = el('div', { class: 'rs', title: 'Arraste para redimensionar' });
    rs.addEventListener('pointerdown', function (e) {
      rs.setPointerCapture(e.pointerId); iframe.style.pointerEvents = 'none';
      var mv = function (ev) { setSW(ev.clientX); }, up = function () { rs.removeEventListener('pointermove', mv); rs.removeEventListener('pointerup', up); iframe.style.pointerEvents = ''; };
      rs.addEventListener('pointermove', mv); rs.addEventListener('pointerup', up);
    });
    app.appendChild(top);
    app.appendChild(el('div', { class: 'main' }, side, rs, el('div', { class: 'stage' }, frameBox)));
    try { var sw = parseInt(localStorage.getItem('ed_sw'), 10); if (sw) setSW(sw); if (localStorage.getItem('ed_np') === '1') app.classList.add('nopanel'); } catch (e) { }
    renderTabs(); renderPane(); updTop();
  }
  function setSW(x) { x = Math.max(250, Math.min(560, x)); app.style.setProperty('--sw', x + 'px'); try { localStorage.setItem('ed_sw', x); } catch (e) { } }
  function togglePanel() { var c = app.classList.toggle('nopanel'); try { localStorage.setItem('ed_np', c ? '1' : '0'); } catch (e) { } }
  function renderAll() { renderTabs(); renderPane(); }
  function renderTabs() {
    tabsEl.innerHTML = '';
    [['structure', 'fa-solid fa-sitemap', 'Estrutura'], ['add', 'fa-solid fa-plus', 'Adicionar elemento'], ['edit', 'fa-solid fa-sliders', 'Editar selecionado'], ['site', 'fa-solid fa-gear', 'Site (SEO, cores, fontes, menu)'], ['media', 'fa-regular fa-images', 'Mídia']].forEach(function (t) {
      tabsEl.appendChild(el('button', { class: S.tab === t[0] ? 'on' : '', title: t[2], onclick: function () { S.tab = t[0]; renderTabs(); renderPane(); } }, el('i', { class: t[1] })));
    });
  }
  function renderPane() {
    pane.innerHTML = '';
    ({ structure: renderTree, add: renderAdd, edit: renderInspector, site: renderSite, media: renderMediaTab })[S.tab]();
  }

  /* ---------- aba Estrutura ---------- */
  function nodeLabel(kind, n, i) {
    if (kind === 'section') return n.label || ('Seção ' + (i + 1));
    if (kind === 'column') { var sp = n.s && n.s.span; return 'Coluna ' + (i + 1) + ' · ' + ((sp && (sp.d || sp)) || 12) + '/12'; }
    var t = (WT[n.type] || [0, n.type])[1], txt = '';
    var p = n.p || {};
    txt = strip(p.html) || p.text || p.title || p.alt || (p.src ? p.src.split('/').pop() : '') || '';
    return t + (txt ? ' — ' + txt.slice(0, 28) : '');
  }
  function actions(kind, id) {
    function b(ic, ti, fn) { return el('button', { icon: ic, title: ti, onclick: function (e) { e.stopPropagation(); fn(); } }); }
    var arr = [b('fa-solid fa-arrow-up', 'Mover para cima', function () { move(id, -1); }), b('fa-solid fa-arrow-down', 'Mover para baixo', function () { move(id, 1); }), b('fa-regular fa-clone', 'Duplicar', function () { dup(id); }), b('fa-regular fa-trash-can', 'Excluir', function () { del(id); })];
    return el('span', { class: 'acts' }, arr);
  }
  function nodeRow(kind, n, i) {
    var ic = kind === 'section' ? 'fa-regular fa-window-maximize' : kind === 'column' ? 'fa-solid fa-table-columns' : (WT[n.type] || ['fa-solid fa-cube'])[0];
    return el('div', { class: 'nd ' + kind[0] + (S.sel && S.sel.id === n.id ? ' sel' : '') + (n.disabled ? ' off' : ''), onclick: function () { select({ kind: kind, id: n.id }, { tab: 'edit' }); } },
      el('span', { class: 'drag fa-solid fa-grip-vertical' }), el('span', { class: 'ic' }, el('i', { class: ic })), el('span', { class: 'nm', text: nodeLabel(kind, n, i) }), actions(kind, n.id));
  }
  function renderTree() {
    if (S.tab !== 'structure') return;
    var keep = pane.scrollTop; pane.innerHTML = '';
    var ul = el('ul', { class: 'tree', id: 'tr-s' });
    S.site.sections.forEach(function (s, i) {
      var li = el('li', { 'data-id': s.id }, nodeRow('section', s, i));
      var cu = el('ul', { 'data-parent': s.id, class: 'tr-c' });
      s.columns.forEach(function (c, j) {
        var cl = el('li', { 'data-id': c.id }, nodeRow('column', c, j));
        var wu = el('ul', { 'data-parent': c.id, class: 'tr-w' });
        c.widgets.forEach(function (w, k) { wu.appendChild(el('li', { 'data-id': w.id }, nodeRow('widget', w, k))); });
        cl.appendChild(wu); cu.appendChild(cl);
      });
      li.appendChild(cu); ul.appendChild(li);
    });
    pane.appendChild(el('div', { class: 'bar' }, el('span', { class: 't', text: 'Estrutura da página' }), el('button', { class: 'btn pri sm', onclick: addSectionMenu }, el('i', { class: 'fa-solid fa-plus' }), ' Seção')));
    pane.appendChild(el('p', { class: 'hint', text: 'Arraste para reordenar (inclusive elementos entre colunas) ou use as setas. Clique para editar.' }));
    pane.appendChild(ul);
    pane.scrollTop = keep;
    if (window.Sortable) {
      Sortable.create(ul, { animation: 150, handle: '.s > .drag', draggable: 'li', filter: 'ul ul *', onEnd: dropEnd, preventOnFilter: false });
      pane.querySelectorAll('.tr-c').forEach(function (u) { Sortable.create(u, { animation: 150, group: 'cols', handle: '.c > .drag', onEnd: dropEnd }); });
      pane.querySelectorAll('.tr-w').forEach(function (u) { Sortable.create(u, { animation: 150, group: 'wids', handle: '.w > .drag', onEnd: dropEnd }); });
    }
  }
  function dropEnd(evt) {
    var id = evt.item.dataset.id, f = findNode(id); if (!f) return;
    var node = f.list.splice(f.idx, 1)[0], newIdx = evt.newIndex, to;
    if (f.kind === 'section') to = S.site.sections;
    else { var pid = evt.to.dataset.parent, p = findNode(pid); to = f.kind === 'column' ? p.node.columns : p.node.widgets; }
    to.splice(newIdx, 0, node);
    touch(true);
  }
  function move(id, d) {
    var f = findNode(id); if (!f) return; var j = f.idx + d;
    if (j < 0 || j >= f.list.length) return;
    f.list.splice(j, 0, f.list.splice(f.idx, 1)[0]); touch(true); postSel(true);
  }
  function dup(id) {
    var f = findNode(id); if (!f) return;
    var c = reid(clone(f.node), f.kind); if (f.kind === 'section') { c.anchor = ''; c.label = (c.label || '') + ' (cópia)'; c.menu = ''; }
    f.list.splice(f.idx + 1, 0, c); touch(true); select({ kind: f.kind, id: c.id }, { tab: S.tab });
  }
  function del(id) {
    var f = findNode(id); if (!f) return;
    if (!confirm('Excluir este item' + (f.kind !== 'widget' ? ' e tudo o que há dentro dele' : '') + '?')) return;
    f.list.splice(f.idx, 1); if (S.sel && S.sel.id === id) S.sel = null;
    touch(true); postSel(false); if (S.tab === 'edit') renderPane();
  }
  function addSectionMenu() {
    var box = el('div', { class: 'bd' }, el('p', { class: 'hint', text: 'Escolha o layout inicial da nova seção (você pode mudar as colunas depois):' }));
    var m = modal('Nova seção', box);
    var pre = el('div', { class: 'pre', style: { height: '54px' } });
    PRESETS.forEach(function (p) {
      pre.appendChild(el('button', { title: p.join(' + '), onclick: function () {
        var s = newSection(p), at = S.sel ? findNode(S.sel.id) : null, idx = at ? at.sec ? S.site.sections.indexOf(at.sec) + 1 : S.site.sections.length : S.site.sections.length;
        S.site.sections.splice(idx, 0, s); m.close(); touch(true); select({ kind: 'section', id: s.id }, { tab: 'edit' });
      } }, p.map(function (n) { return el('b', { style: { flex: String(n) } }); })));
    });
    box.appendChild(pre);
  }

  /* ---------- aba Elementos ---------- */
  function targetColumn() {
    var f = S.sel && findNode(S.sel.id); if (!f) return null;
    if (f.kind === 'column') return { col: f.node, at: f.node.widgets.length };
    if (f.kind === 'widget') return { col: f.col, at: f.idx + 1 };
    var sec = f.node; if (!sec.columns.length) sec.columns.push(newColumn(12));
    var c = sec.columns[sec.columns.length - 1]; return { col: c, at: c.widgets.length };
  }
  function renderAdd() {
    pane.appendChild(el('div', { class: 'bar' }, el('span', { class: 't', text: 'Adicionar elemento' })));
    var t = targetColumn();
    pane.appendChild(el('p', { class: 'hint', text: t ? 'O elemento será adicionado na coluna selecionada.' : 'Primeiro selecione uma seção, coluna ou elemento (na aba Estrutura ou clicando no site).' }));
    var g = el('div', { class: 'pal' });
    Object.keys(WT).forEach(function (k) {
      g.appendChild(el('button', { onclick: function () {
        var tg = targetColumn(); if (!tg) { toast('Selecione antes uma seção ou coluna.', true); return; }
        var w = newWidget(k); tg.col.widgets.splice(tg.at, 0, w);
        touch(true); select({ kind: 'widget', id: w.id }, { tab: 'edit' });
      } }, el('i', { class: WT[k][0] }), el('span', { text: WT[k][1] })));
    });
    pane.appendChild(g);
  }

  /* ---------- campos ---------- */
  function swatches(input, onPick) {
    var c = (S.site.settings && S.site.settings.colors) || {}, list = [];
    [['primary', '#d48a67'], ['dark', '#5f5e5c'], ['cream', '#fffaf4'], ['cream2', '#fcf6ef'], ['light', '#ffffff']].forEach(function (x) { list.push(['var(--c-' + x[0] + ')', c[x[0]] || x[1]]); });
    list.push(['transparent', 'transparent']);
    var w = el('div', { class: 'sw' });
    list.forEach(function (x) { w.appendChild(el('i', { title: x[0], style: { background: x[1] === 'transparent' ? 'repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 50%/10px 10px' : x[1] }, onclick: function () { onPick(x[0]); } })); });
    return w;
  }
  function resolveColor(v) {
    var m = /^var\(--c-(\w+)\)$/.exec(v || ''); if (!m) return v || '';
    var c = (S.site.settings && S.site.settings.colors) || {}; var d = { primary: '#d48a67', dark: '#5f5e5c', cream: '#fffaf4', cream2: '#fcf6ef', light: '#ffffff', text: '#5f5e5c' };
    return c[m[1]] || d[m[1]] || '';
  }
  function toHex(v) { v = resolveColor(v); return /^#[0-9a-f]{6}$/i.test(v) ? v : (/^#([0-9a-f]{3})$/i.test(v) ? '#' + v.slice(1).split('').map(function (x) { return x + x; }).join('') : '#ffffff'); }

  function rget(node, f) {
    if (!f.k) return { v: '', inh: '' };
    var v = get(node, f.k);
    if (!f.r) return { v: v === undefined ? '' : v, inh: '' };
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      var order = S.dev === 'd' ? ['d'] : S.dev === 't' ? ['t', 'd'] : ['m', 't', 'd'], own = v[S.dev];
      var inh = ''; for (var i = 0; i < order.length; i++) if (v[order[i]] !== undefined && v[order[i]] !== '') { inh = v[order[i]]; break; }
      return { v: own === undefined ? '' : own, inh: inh };
    }
    return { v: S.dev === 'd' ? (v === undefined ? '' : v) : '', inh: v === undefined ? '' : v };
  }
  function rset(node, f, val) {
    if (!f.r) { set(node, f.k, val); return; }
    var cur = get(node, f.k), o;
    if (cur && typeof cur === 'object' && !Array.isArray(cur)) o = cur; else o = (cur === undefined || cur === '') ? {} : { d: cur };
    if (val === '' || val === undefined) delete o[S.dev]; else o[S.dev] = val;
    set(node, f.k, Object.keys(o).length ? o : '');
  }
  function label(f) {
    return el('label', {}, el('span', { text: f.l }), f.r ? el('span', { class: 'dv', text: { d: 'Desktop', t: 'Tablet', m: 'Celular' }[S.dev] }) : null);
  }
  var onField = function (node, f, val, structural) { rset(node, f, val); touch(!!structural); };

  function field(node, f) {
    var w = el('div', { class: 'f' + (f.t === 'num' ? ' h' : '') }), cur = rget(node, f), t = f.t;
    if (t === 'tog') {
      var v0 = get(node, f.k); if (v0 === undefined && f.def) v0 = true;
      var cb = el('input', { type: 'checkbox', onchange: function () { onField(node, f, cb.checked ? true : (f.def ? false : '')); } }); cb.checked = !!v0;
      return el('div', { class: 'f h' }, el('label', { class: 'tog' }, cb, el('span', { text: f.l })));
    }
    w.appendChild(label(f));
    var inp;
    if (t === 'txt' || t === 'num' || t === 'anchor') {
      inp = el('input', { type: 'text', value: cur.v, placeholder: cur.inh !== '' && f.r ? String(cur.inh) : '', oninput: function () {
        var v = inp.value; if (t === 'anchor') { v = slug(v); }
        onField(node, f, v, f.k === 'label');
      } });
      w.appendChild(inp);
      if (t === 'anchor') w.appendChild(el('button', { class: 'btn sm', style: { marginTop: '6px' }, text: 'Gerar a partir do nome', onclick: function () { inp.value = slug(node.label || 'secao'); onField(node, f, inp.value); } }));
    } else if (t === 'area') {
      inp = el('textarea', { oninput: function () { onField(node, f, inp.value); } }); inp.value = cur.v; w.appendChild(inp);
    } else if (t === 'code') {
      inp = el('textarea', { style: { fontFamily: 'ui-monospace,monospace', minHeight: '160px' }, spellcheck: 'false', oninput: function () { onField(node, f, inp.value); } }); inp.value = cur.v; w.appendChild(inp);
    } else if (t === 'sel') {
      inp = el('select', { onchange: function () { onField(node, f, inp.value); } }, f.o.map(function (o) { return el('option', { value: o[0], text: o[1] }); }));
      var val = cur.v; if (f.r && val === '') val = ''; inp.value = String(val === true ? '' : val);
      if (inp.value !== String(val)) inp.value = '';
      w.appendChild(inp);
    } else if (t === 'seg') {
      var seg = el('div', { class: 'seg' });
      f.o.forEach(function (o) {
        var b = el('button', { class: (cur.v || cur.inh) === o[0] && (cur.v !== '' || f.r) ? (cur.v === o[0] ? 'on' : '') : '', title: o[0], onclick: function () {
          var again = rget(node, f).v === o[0]; onField(node, f, again && f.r ? '' : o[0]); renderPane();
        } }); b.innerHTML = o[1]; seg.appendChild(b);
      });
      if (!f.r) [].forEach.call(seg.children, function (b, i) { b.classList.toggle('on', f.o[i][0] === cur.v); });
      w.appendChild(seg);
    } else if (t === 'color') {
      var txt = el('input', { type: 'text', value: cur.v, placeholder: f.r && cur.inh ? cur.inh : '#hex, rgba() ou vazio', oninput: function () { onField(node, f, txt.value.trim()); pick.value = toHex(txt.value); } });
      var pick = el('input', { type: 'color', value: toHex(cur.v || cur.inh), oninput: function () { txt.value = pick.value; onField(node, f, pick.value); } });
      w.appendChild(el('div', { class: 'row' }, pick, txt, el('button', { class: 'btn sm fix', text: '✕', title: 'Limpar', onclick: function () { txt.value = ''; onField(node, f, ''); renderPane(); } })));
      w.appendChild(swatches(txt, function (v) { txt.value = v; onField(node, f, v); pick.value = toHex(v); }));
    } else if (t === 'img') {
      var th = el('div', { class: 'th' }); var u = cur.v;
      function showTh(v) { th.style.backgroundImage = v ? 'url(' + BASE + '/' + v.replace(/^\//, '') + ')' : ''; th.innerHTML = v ? '' : '<i class="fa-regular fa-image"></i>'; if (/^https?:/.test(v || '')) th.style.backgroundImage = 'url(' + v + ')'; }
      showTh(u);
      w.appendChild(el('div', { class: 'img' }, th, el('div', { class: 'bt' },
        el('button', { class: 'btn sm', onclick: function () { openMedia(function (p) { onField(node, f, p); showTh(p); }); } }, el('i', { class: 'fa-solid fa-photo-film' }), ' Escolher / enviar'),
        u ? el('button', { class: 'btn sm dng', text: 'Remover', onclick: function () { onField(node, f, ''); renderPane(); } }) : null)));
    } else if (t === 'icon') {
      var dl = 'ic-' + uid('');
      inp = el('input', { type: 'text', list: dl, value: cur.v, placeholder: 'fa-brands fa-whatsapp (ou emoji)', oninput: function () { onField(node, f, inp.value); } });
      w.appendChild(inp); w.appendChild(el('datalist', { id: dl }, ICONS.map(function (i) { return el('option', { value: i }); })));
      w.appendChild(el('div', { class: 'hint', style: { margin: '4px 0 0' }, html: '' }, 'Veja mais em fontawesome.com/icons (gratuitos).'));
    } else if (t === 'hide') {
      var o = get(node, f.k) || {};
      var row = el('div', { class: 'row' });
      [['d', 'Desktop'], ['t', 'Tablet'], ['m', 'Celular']].forEach(function (x) {
        var c = el('input', { type: 'checkbox', onchange: function () { var h = Object.assign({}, get(node, f.k) || {}); if (c.checked) h[x[0]] = true; else delete h[x[0]]; set(node, f.k, Object.keys(h).length ? h : ''); touch(); } }); c.checked = !!o[x[0]];
        row.appendChild(el('label', { class: 'tog', style: { fontSize: '12px' } }, c, x[1]));
      });
      w.appendChild(row);
    } else if (t === 'span') {
      var sv = cur.v || ''; var inh = cur.inh || 12;
      var sel = el('select', { onchange: function () { onField(node, f, sel.value ? Number(sel.value) : ''); } }, [el('option', { value: '', text: 'Herdar (' + inh + ')' })].concat(Array.apply(null, Array(12)).map(function (_, i) { return el('option', { value: String(i + 1), text: (i + 1) + ' de 12' + (i + 1 === 12 ? ' (toda a largura)' : i + 1 === 6 ? ' (metade)' : '') }); })));
      sel.value = String(sv); w.appendChild(sel);
    } else if (t === 'corners') {
      w.appendChild(cornersField(node, f, cur.v));
    } else if (t === 'range') {
      var hasV = cur.v !== '' && cur.v !== undefined, shown = hasV ? cur.v : (cur.inh !== '' ? cur.inh : (f.def !== undefined ? f.def : f.min));
      var rg = el('input', { type: 'range', min: f.min, max: f.max, step: f.step || 1, value: shown });
      var nb = el('input', { type: 'number', min: f.min, max: f.max, value: hasV ? cur.v : '', placeholder: String(shown), style: { width: '64px', flex: 'none' } });
      rg.addEventListener('input', function () { nb.value = rg.value; onField(node, f, Number(rg.value)); });
      nb.addEventListener('input', function () { if (nb.value === '') { onField(node, f, ''); return; } rg.value = nb.value; onField(node, f, Number(nb.value)); });
      w.appendChild(el('div', { class: 'row' }, rg, nb, el('button', { class: 'btn sm fix', text: '↺', title: 'Padrão', onclick: function () { onField(node, f, ''); renderPane(); } })));
    } else if (t === 'focal') {
      w.appendChild(focalField(node, f));
    } else if (t === 'rich') {
      w.appendChild(richEditor(cur.v, function (h) { onField(node, f, h, false); }));
    } else if (t === 'gal') {
      w.appendChild(galleryField(node, f));
    } else if (t === 'rep') {
      w.appendChild(repeater(node, f));
    }
    return w;
  }

  function cornersField(node, f, raw) {
    raw = String(raw || '').trim();
    var pr = raw ? raw.split(/\s+/) : [], e;
    e = pr.length === 1 ? [pr[0], pr[0], pr[0], pr[0]] : pr.length === 2 ? [pr[0], pr[1], pr[0], pr[1]] : pr.length === 3 ? [pr[0], pr[1], pr[2], pr[1]] : pr.length === 4 ? pr : ['0', '0', '0', '0'];
    var isPct = /%/.test(raw), box = el('div', {}), grid = el('div', { class: 'cg' }), ins = [];
    ['↖ topo esq.', '↗ topo dir.', '↘ base dir.', '↙ base esq.'].forEach(function (lb, i) {
      var inp = el('input', { type: 'number', min: 0, max: 600, value: isPct ? '' : (parseFloat(e[i]) || 0), placeholder: isPct ? '%' : '0', title: lb + ' (px)' });
      inp.addEventListener('input', function () {
        var v = ins.map(function (x) { return Math.max(0, Number(x.value) || 0); });
        onField(node, f, v.every(function (n) { return n === 0; }) ? '' : v.join('px ') + 'px');
      });
      ins.push(inp); grid.appendChild(el('label', { class: 'cc' }, el('span', { text: lb }), inp));
    });
    box.appendChild(grid);
    var pre = el('div', { class: 'chips' });
    [['Reto', ''], ['Suave', '24px'], ['Folha', '28px 140px 28px 140px'], ['Folha ↔', '140px 28px 140px 28px'], ['Arco', '999px 999px 0 0'], ['Pílula', '999px'], ['Círculo', '50%']].forEach(function (x) {
      pre.appendChild(el('button', { class: 'chip', text: x[0], title: x[1] || 'sem arredondamento', onclick: function () { onField(node, f, x[1]); renderPane(); } }));
    });
    box.appendChild(pre);
    box.appendChild(el('div', { class: 'hint', style: { margin: '4px 0 0' }, text: 'Dica: "Círculo" e "Pílula" ficam melhores com proporção 1:1 / altura definida.' }));
    return box;
  }
  function respVal(node, path) {
    var v = get(node, path);
    if (v && typeof v === 'object') { var o = S.dev === 'd' ? ['d'] : S.dev === 't' ? ['t', 'd'] : ['m', 't', 'd']; for (var i = 0; i < o.length; i++) if (v[o[i]]) return v[o[i]]; return ''; }
    return v || '';
  }
  function focalField(node, f) {
    var fx = { k: f.kx, r: 1 }, fy = { k: f.ky, r: 1 };
    var src = respVal(node, f.src), box = el('div', { class: 'focal' });
    if (!src) { box.appendChild(el('div', { class: 'hint', style: { margin: '10px' }, text: 'Escolha uma imagem primeiro.' })); return box; }
    var im = el('img', { src: /^https?:/.test(src) ? src : BASE + '/' + src.replace(/^\//, ''), draggable: 'false' });
    var dot = el('span', { class: 'dot' });
    function place() { var x = rget(node, fx), y = rget(node, fy); dot.style.left = ((x.v !== '' ? x.v : (x.inh !== '' ? x.inh : 50))) + '%'; dot.style.top = ((y.v !== '' ? y.v : (y.inh !== '' ? y.inh : 50))) + '%'; }
    function setFrom(e) {
      var r = im.getBoundingClientRect(); var x = Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100))), y = Math.max(0, Math.min(100, Math.round((e.clientY - r.top) / r.height * 100)));
      rset(node, fx, x); rset(node, fy, y); place(); touch();
    }
    var drag = false;
    box.addEventListener('pointerdown', function (e) { drag = true; box.setPointerCapture(e.pointerId); setFrom(e); });
    box.addEventListener('pointermove', function (e) { if (drag) setFrom(e); });
    box.addEventListener('pointerup', function () { drag = false; renderPaneSoon(); });
    box.appendChild(im); box.appendChild(dot); place();
    return box;
  }
  var renderPaneSoon = debounce(function () { if (S.tab === 'edit') { var k = pane.scrollTop; renderPane(); pane.scrollTop = k; } }, 50);

  function repeater(node, f) {
    var box = el('div', {}); var items = get(node, f.k) || [];
    function draw() {
      box.innerHTML = '';
      (get(node, f.k) || []).forEach(function (it, i) {
        var r = el('div', { class: 'rep' }, el('div', { class: 'h' }, el('span', { text: '#' + (i + 1) + ' ' + String(it[f.title] || '').slice(0, 24) }),
          el('span', {}, el('button', { class: 'btn sm', icon: 'fa-solid fa-arrow-up', onclick: function () { var a = get(node, f.k); if (i > 0) { a.splice(i - 1, 0, a.splice(i, 1)[0]); touch(); draw(); } } }), ' ',
            el('button', { class: 'btn sm', icon: 'fa-solid fa-arrow-down', onclick: function () { var a = get(node, f.k); if (i < a.length - 1) { a.splice(i + 1, 0, a.splice(i, 1)[0]); touch(); draw(); } } }), ' ',
            el('button', { class: 'btn sm dng', icon: 'fa-regular fa-trash-can', onclick: function () { get(node, f.k).splice(i, 1); touch(); draw(); } }))));
        f.sub.forEach(function (sf) { r.appendChild(field(it, Object.assign({}, sf))); });
        box.appendChild(r);
      });
      box.appendChild(el('button', { class: 'btn blk', onclick: function () { var a = get(node, f.k); if (!a) { set(node, f.k, []); a = get(node, f.k); } a.push(clone(f.add)); touch(); draw(); } }, el('i', { class: 'fa-solid fa-plus' }), ' Adicionar item'));
    }
    draw(); return box;
  }
  function galleryField(node, f) {
    var box = el('div', {});
    function draw() {
      box.innerHTML = ''; var g = el('div', { class: 'media' });
      (get(node, f.k) || []).forEach(function (it, i) {
        g.appendChild(el('div', { class: 'mi', style: { backgroundImage: 'url(' + BASE + '/' + it.src + ')' }, title: it.alt || '' },
          el('button', { icon: 'fa-solid fa-xmark', title: 'Remover', onclick: function () { get(node, f.k).splice(i, 1); touch(); draw(); } })));
      });
      box.appendChild(g);
      box.appendChild(el('button', { class: 'btn blk', style: { marginTop: '8px' }, onclick: function () {
        openMedia(function (paths) { var a = get(node, f.k); if (!a) { set(node, f.k, []); a = get(node, f.k); } paths.forEach(function (p) { a.push({ src: p, alt: '' }); }); touch(); draw(); }, true);
      } }, el('i', { class: 'fa-solid fa-plus' }), ' Adicionar imagens'));
      box.appendChild(el('p', { class: 'hint', style: { marginTop: '8px' }, text: 'Dica: depoimentos em imagem podem ser adicionados aqui.' }));
    }
    draw(); return box;
  }

  /* editor de texto rico */
  function richEditor(html, onChange) {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); document.execCommand('styleWithCSS', false, true); } catch (e) { }
    var ed = el('div', { class: 'rte', contenteditable: 'true' }); ed.innerHTML = html || '';
    var fire = function () { onChange(ed.innerHTML); };
    ed.addEventListener('input', fire);
    ed.addEventListener('paste', function (e) { e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
    function cmd(c, v) { return function (e) { e.preventDefault(); ed.focus(); document.execCommand(c, false, v || null); fire(); }; }
    function B(ic, ti, fn) { var b = el('button', { type: 'button', icon: ic, title: ti }); b.addEventListener('mousedown', fn); return b; }
    var colorIn = el('input', { type: 'color', value: '#d48a67', title: 'Cor do texto selecionado' });
    colorIn.addEventListener('input', function () { ed.focus(); document.execCommand('foreColor', false, colorIn.value); fire(); });
    var tb = el('div', { class: 'rte-t' },
      B('fa-solid fa-bold', 'Negrito', cmd('bold')), B('fa-solid fa-italic', 'Itálico', cmd('italic')), B('fa-solid fa-underline', 'Sublinhado', cmd('underline')),
      B('fa-solid fa-list-ul', 'Lista', cmd('insertUnorderedList')), B('fa-solid fa-list-ol', 'Lista numerada', cmd('insertOrderedList')),
      B('fa-solid fa-align-left', 'Esquerda', cmd('justifyLeft')), B('fa-solid fa-align-center', 'Centro', cmd('justifyCenter')), B('fa-solid fa-align-right', 'Direita', cmd('justifyRight')),
      B('fa-solid fa-link', 'Link', function (e) { e.preventDefault(); var u = prompt('Endereço do link (https://… ou #seção):', 'https://'); if (u) { ed.focus(); document.execCommand('createLink', false, u); fire(); } }),
      B('fa-solid fa-link-slash', 'Remover link', cmd('unlink')),
      B('fa-solid fa-palette', 'Destaque (cor principal)', function (e) { e.preventDefault(); ed.focus(); document.execCommand('foreColor', false, (S.site.settings.colors && S.site.settings.colors.primary) || '#d48a67'); fire(); }),
      colorIn,
      B('fa-regular fa-face-smile', 'Emoji', function (e) { e.preventDefault(); var em = prompt('Cole um emoji (ex.: 🔸 💜 🌿 👉):', '🔸'); if (em) { ed.focus(); document.execCommand('insertText', false, em); fire(); } }),
      B('fa-solid fa-eraser', 'Limpar formatação', cmd('removeFormat')));
    return el('div', {}, tb, ed);
  }

  /* ---------- aba Editar (inspetor) ---------- */
  function renderGroups(node, schema) {
    schema.forEach(function (g) {
      var d = el('details', { class: 'grp' }); if (g.open) d.open = true;
      d.appendChild(el('summary', { text: g.g })); var b = el('div', { class: 'gb' });
      g.f.forEach(function (f) { b.appendChild(field(node, Object.assign({}, f))); });
      d.appendChild(b); pane.appendChild(d);
    });
  }
  function renderInspector() {
    var f = S.sel && findNode(S.sel.id);
    if (!f) { pane.appendChild(el('p', { class: 'hint', text: 'Clique em qualquer parte do site (à direita) ou na aba Estrutura para editar.' })); return; }
    var kindName = { section: 'Seção', column: 'Coluna', widget: (WT[f.node.type] || [0, 'Elemento'])[1] }[f.kind];
    var bar = el('div', { class: 'bar' }, el('div', { style: { flex: 1, minWidth: 0 } }, el('div', { class: 'crumb', text: f.kind === 'section' ? 'Seção' : f.kind === 'column' ? 'Seção › Coluna' : 'Seção › Coluna › ' + kindName }), el('div', { class: 't', text: kindName })));
    [['fa-solid fa-arrow-up', 'Subir', function () { move(f.node.id, -1); }], ['fa-solid fa-arrow-down', 'Descer', function () { move(f.node.id, 1); }], ['fa-regular fa-clone', 'Duplicar', function () { dup(f.node.id); }], ['fa-regular fa-trash-can', 'Excluir', function () { del(f.node.id); }]].forEach(function (a) {
      bar.appendChild(el('button', { class: 'btn sm' + (a[1] === 'Excluir' ? ' dng' : ''), icon: a[0], title: a[1], onclick: a[2] }));
    });
    pane.appendChild(bar);
    if (f.kind === 'widget') {
      renderGroups(f.node, SCHEMA[f.node.type] || []);
      pane.appendChild(el('div', { class: 'row', style: { marginBottom: '14px' } }, el('button', { class: 'btn', onclick: function () { select({ kind: 'column', id: f.col.id }, { tab: 'edit' }); } }, el('i', { class: 'fa-solid fa-turn-up' }), ' Selecionar coluna'), el('button', { class: 'btn', onclick: function () { select({ kind: 'section', id: f.sec.id }, { tab: 'edit' }); } }, el('i', { class: 'fa-solid fa-turn-up' }), ' Selecionar seção')));
    } else if (f.kind === 'column') {
      renderGroups(f.node, COLUMN_SCHEMA);
      pane.appendChild(el('button', { class: 'btn blk', onclick: function () { select({ kind: 'section', id: f.sec.id }, { tab: 'edit' }); } }, el('i', { class: 'fa-solid fa-turn-up' }), ' Selecionar seção desta coluna'));
    } else {
      renderGroups(f.node, SECTION_SCHEMA);
      pane.appendChild(el('button', { class: 'btn blk', style: { marginBottom: '8px' }, onclick: function () {
        var c = newColumn(6); f.node.columns.push(c); touch(true); select({ kind: 'column', id: c.id }, { tab: 'edit' });
      } }, el('i', { class: 'fa-solid fa-plus' }), ' Adicionar coluna a esta seção'));
    }
  }

  /* ---------- aba Site ---------- */
  function renderSite() {
    var st = S.site.settings = S.site.settings || {};
    pane.appendChild(el('div', { class: 'bar' }, el('span', { class: 't', text: 'Configurações do site' })));
    var T = [
      { g: 'SEO e compartilhamento', open: true, f: [{ t: 'txt', k: 'title', l: 'Título da página (aba do navegador/Google)' }, { t: 'area', k: 'description', l: 'Descrição (Google e redes sociais)' }, { t: 'img', k: 'ogImage', l: 'Imagem de compartilhamento' }, { t: 'img', k: 'favicon', l: 'Ícone da aba (favicon)' }, { t: 'color', k: 'themeColor', l: 'Cor da barra do navegador (celular)' }] },
      { g: 'Rolagem e animações', open: true, f: [{ t: 'seg', k: 'autoscroll', l: 'Auto-scroll por seção (desktop)', o: [['sections', 'Ligado'], ['off', 'Desligado']] }, { t: 'tog', k: 'backToTop', l: 'Botão "voltar ao topo" (aparece ao rolar)', def: true }] },
      { g: 'Cores do tema', open: false, f: ['primary:Cor principal', 'dark:Cor escura', 'cream:Fundo claro', 'cream2:Fundo claro 2', 'text:Cor do texto', 'light:Branco'].map(function (x) { var p = x.split(':'); return { t: 'color', k: 'colors.' + p[0], l: p[1] }; }) },
      { g: 'Fontes', open: false, f: [{ t: 'sel', k: 'fonts.body', l: 'Texto', o: FONTS.map(function (x) { return [x, x]; }) }, { t: 'sel', k: 'fonts.heading', l: 'Títulos', o: FONTS.map(function (x) { return [x, x]; }) }, { t: 'sel', k: 'fonts.script', l: 'Cursiva', o: FONTS.map(function (x) { return [x, x]; }) }] },
      { g: 'Cabeçalho / menu', open: false, f: [{ t: 'tog', k: 'header.enabled', l: 'Mostrar cabeçalho' }, { t: 'img', k: 'header.logo', l: 'Logo' }, { t: 'num', k: 'header.logoH', l: 'Altura do logo (px)' }, { t: 'tog', k: 'header.logoOnScroll', l: 'Mostrar logo só ao rolar' }, { t: 'tog', k: 'header.hideAtTop', l: 'Esconder menu no topo (computador)' }, { t: 'tog', k: 'header.hideAtTopMobile', l: 'Esconder menu no topo (celular/tablet)' }, { t: 'tog', k: 'header.solidOnScroll', l: 'Fundo sólido ao rolar' }, { t: 'color', k: 'header.bg', l: 'Fundo no topo' }, { t: 'color', k: 'header.color', l: 'Cor dos links' }, { t: 'color', k: 'header.solidBg', l: 'Fundo ao rolar' }, { t: 'color', k: 'header.solidColor', l: 'Cor dos links ao rolar' },
        { t: 'seg', k: 'header.menuMode', l: 'Itens do menu', o: [['auto', 'Automático (seções)'], ['custom', 'Personalizado']] }, { t: 'rep', k: 'header.menu', l: 'Menu personalizado', add: { label: 'Item', url: '#' }, sub: [{ t: 'txt', k: 'label', l: 'Texto' }, { t: 'txt', k: 'url', l: 'Link' }], title: 'label' },
        { t: 'txt', k: 'header.btnText', l: 'Botão do cabeçalho (vazio = sem botão)' }, { t: 'txt', k: 'header.btnUrl', l: 'Link do botão' }, { t: 'icon', k: 'header.btnIcon', l: 'Ícone do botão' }] }
    ];
    T.forEach(function (g) {
      var d = el('details', { class: 'grp' }); if (g.open) d.open = true; d.appendChild(el('summary', { text: g.g })); var b = el('div', { class: 'gb' });
      g.f.forEach(function (f) {
        f = Object.assign({}, f);
        if (f.k === 'autoscroll') { var v = st.autoscroll; if (!v) st.autoscroll = 'sections'; }
        var node = st; var fld = Object.assign({}, f, { k: f.k });
        b.appendChild(field(node, fld));
      });
      d.appendChild(b); pane.appendChild(d);
    });
    pane.appendChild(el('div', { class: 'grp' }, el('div', {},
      el('button', { class: 'btn blk', style: { marginBottom: '8px' }, onclick: showHistory }, el('i', { class: 'fa-solid fa-clock-rotate-left' }), ' Versões anteriores'),
      el('button', { class: 'btn blk', style: { marginBottom: '12px' }, onclick: showAccount }, el('i', { class: 'fa-solid fa-key' }), ' Alterar usuário / senha'))));
  }

  /* ---------- mídia ---------- */
  function modal(title, body) {
    var o = el('div', { class: 'modal', onmousedown: function (e) { if (e.target === o) close(); } });
    function close() { o.remove(); }
    o.appendChild(el('div', { class: 'mbox' }, el('header', {}, el('span', { text: title }), el('button', { class: 'btn sm', text: '✕', onclick: close })), body));
    document.body.appendChild(o); return { close: close, el: o };
  }
  function mediaGrid(cb, multi, deletable) {
    var wrap = el('div', {}), grid = el('div', { class: 'media' }), picked = [];
    var fileIn = el('input', { type: 'file', multiple: true, accept: 'image/*', style: { display: 'none' }, onchange: function () { up(fileIn.files); } });
    var drop = el('div', { class: 'drop' }, el('i', { class: 'fa-solid fa-cloud-arrow-up' }), ' Arraste imagens aqui ou ', el('button', { class: 'btn sm', text: 'escolher arquivos', onclick: function () { fileIn.click(); } }), el('div', { class: 'hint', style: { margin: '6px 0 0' }, text: 'JPG, PNG, WebP, GIF, SVG, AVIF — até 15 MB (imagens grandes são otimizadas).' }));
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { up(e.dataTransfer.files); });
    function up(files) {
      if (!files || !files.length) return; var fd = new FormData(); [].forEach.call(files, function (f) { fd.append('files[]', f); });
      drop.style.opacity = .5;
      api('upload', { form: fd }).then(function (r) { if (r.errors && r.errors.length) toast(r.errors.join(' | '), true); else toast('Envio concluído'); load(); }).catch(function (e) { toast(e.message, true); }).then(function () { drop.style.opacity = 1; });
    }
    function load() {
      api('media').then(function (r) {
        grid.innerHTML = '';
        r.items.forEach(function (m) {
          var item = el('div', { class: 'mi' + (m.svg ? ' svg' : ''), title: m.name, style: { backgroundImage: 'url(' + m.url + ')' }, onclick: function () {
            if (multi) { var i = picked.indexOf(m.path); if (i < 0) { picked.push(m.path); item.style.borderColor = 'var(--ac)'; } else { picked.splice(i, 1); item.style.borderColor = ''; } if (okBtn) okBtn.textContent = 'Usar ' + picked.length + ' selecionada(s)'; }
            else if (cb) cb(m.path);
          } });
          if (deletable) item.appendChild(el('button', { icon: 'fa-regular fa-trash-can', title: 'Excluir arquivo', onclick: function (e) { e.stopPropagation(); if (confirm('Excluir "' + m.name + '" definitivamente? Se ela estiver em uso, ficará quebrada no site.')) api('media_delete', { body: { path: m.path } }).then(load).catch(function (er) { toast(er.message, true); }); } }));
          grid.appendChild(item);
        });
        if (!r.items.length) grid.appendChild(el('p', { class: 'hint', text: 'Nenhuma imagem ainda.' }));
      }).catch(function (e) { toast(e.message, true); });
    }
    var okBtn = multi ? el('button', { class: 'btn pri', style: { marginTop: '12px' }, text: 'Usar 0 selecionada(s)', onclick: function () { if (picked.length) cb(picked); } }) : null;
    wrap.appendChild(drop); wrap.appendChild(fileIn); wrap.appendChild(grid); if (okBtn) wrap.appendChild(okBtn);
    load(); return wrap;
  }
  function openMedia(cb, multi) {
    var body = el('div', { class: 'bd' });
    var m = modal(multi ? 'Escolha as imagens' : 'Escolha a imagem', body);
    body.appendChild(mediaGrid(function (p) { m.close(); cb(p); }, multi, false));
  }
  function renderMediaTab() {
    pane.appendChild(el('div', { class: 'bar' }, el('span', { class: 't', text: 'Biblioteca de mídia' })));
    pane.appendChild(mediaGrid(function (p) { navigator.clipboard && navigator.clipboard.writeText(p); toast('Caminho copiado: ' + p); }, false, true));
  }

  /* ---------- versões e conta ---------- */
  function showHistory() {
    var body = el('div', { class: 'bd' }, el('p', { class: 'hint', text: 'Cada vez que você salva, a versão anterior é guardada (últimas 30).' }));
    var m = modal('Versões anteriores', body);
    api('backups').then(function (r) {
      if (!r.items.length) body.appendChild(el('p', { text: 'Ainda não há versões anteriores.' }));
      r.items.forEach(function (b) {
        body.appendChild(el('div', { class: 'row', style: { marginBottom: '8px' } }, el('span', { text: b.label }), el('button', { class: 'btn sm fix', text: 'Restaurar no editor', onclick: function () {
          if (!confirm('Carregar esta versão no editor? Você ainda precisará clicar em Salvar.')) return;
          api('restore', { body: { file: b.file } }).then(function (x) { S.site = x.site; S.sel = null; S.dirty = true; snap(); m.close(); renderAll(); preview(); toast('Versão carregada. Clique em Salvar para publicar.'); }).catch(function (e) { toast(e.message, true); });
        } })));
      });
    });
  }
  function showAccount() {
    var u = el('input', { type: 'text', placeholder: 'Novo usuário (opcional)' }), c = el('input', { type: 'password', placeholder: 'Senha atual' }), n = el('input', { type: 'password', placeholder: 'Nova senha (mín. 10 caracteres)' });
    var body = el('div', { class: 'bd' }, el('div', { class: 'f' }, u), el('div', { class: 'f' }, c), el('div', { class: 'f' }, n),
      el('button', { class: 'btn pri', text: 'Alterar', onclick: function () {
        api('password', { body: { user: u.value, current: c.value, new: n.value } }).then(function () { toast('Credenciais atualizadas.'); m.close(); }).catch(function (e) { toast(e.message, true); });
      } }));
    var m = modal('Alterar usuário / senha', body);
  }

  /* ---------- atalhos e inicialização ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === '[' && !/input|textarea|select/i.test(e.target.tagName) && !e.target.isContentEditable) { togglePanel(); return; }
    var mod = e.ctrlKey || e.metaKey; if (!mod) return;
    var k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); save(); }
    else if ((k === 'z' && !e.shiftKey) && !/input|textarea/i.test(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); snap(); restoreHist(S.hi - 1); }
    else if ((k === 'y' || (k === 'z' && e.shiftKey)) && !/input|textarea/i.test(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); restoreHist(S.hi + 1); }
  });
  window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  api('load').then(function (r) {
    S.site = r.site; CFG.csrf = r.csrf;
    S.site.settings = S.site.settings || {}; S.site.sections = S.site.sections || [];
    S.site.sections.forEach(function (s) { s.columns = s.columns || []; s.columns.forEach(function (c) { c.widgets = c.widgets || []; }); });
    S.hist = [JSON.stringify(S.site)]; S.hi = 0;
    build();
  }).catch(function (e) { document.getElementById('app').innerHTML = '<div class="loading">Erro: ' + e.message + '</div>'; });
})();

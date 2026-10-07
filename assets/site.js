/* Comportamento do site: animações, menu, auto-scroll por seção, lightbox */
(function () {
  var D = document, W = window;
  var cfg = W.SITE_CFG || {};
  var reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* animações de entrada */
  function initAnim(root) {
    var els = (root || D).querySelectorAll('[data-anim]:not(.in)');
    if (!('IntersectionObserver' in W)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  W.__initAnim = initAnim;
  initAnim();

  /* cabeçalho */
  var hdr = D.getElementById('hdr'), prog = D.getElementById('prog');
  function onScroll() {
    var y = W.scrollY || D.documentElement.scrollTop;
    if (hdr) { hdr.classList.toggle('scrolled', y > 60); hdr.classList.toggle('solid', hdr.classList.contains('sos') && y > 60); }
    if (prog) { var h = D.documentElement.scrollHeight - W.innerHeight; prog.style.width = (h > 0 ? y / h * 100 : 0) + '%'; }
    mark();
  }
  var burger = D.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var o = D.body.classList.toggle('nav-open'); burger.setAttribute('aria-expanded', o);
    });
    D.querySelectorAll('#nav a').forEach(function (a) { a.addEventListener('click', function () { D.body.classList.remove('nav-open'); }); });
  }

  /* seções e pontos laterais */
  var secs = [].slice.call(D.querySelectorAll('main > .sec'));
  var snapSecs = secs.filter(function (s) { return !s.hasAttribute('data-nosnap'); });
  var dots = D.getElementById('dots');
  if (dots && snapSecs.length > 1) {
    snapSecs.forEach(function (s, i) {
      var a = D.createElement('a'); a.href = '#' + (s.id || ''); a.setAttribute('aria-label', s.dataset.label || ('Seção ' + (i + 1)));
      a.innerHTML = '<span>' + (s.dataset.label || ('Seção ' + (i + 1))) + '</span>';
      a.addEventListener('click', function (e) { e.preventDefault(); go(i); });
      dots.appendChild(a);
    });
  } else if (dots) dots.style.display = 'none';

  function cur() {
    var mid = W.scrollY + W.innerHeight * 0.4, c = 0;
    snapSecs.forEach(function (s, i) { if (s.offsetTop <= mid) c = i; });
    return c;
  }
  function mark() {
    var c = cur();
    if (dots) [].forEach.call(dots.children, function (a, i) { a.classList.toggle('on', i === c); });
    var id = snapSecs[c] && snapSecs[c].id;
    D.querySelectorAll('#nav a:not(.btn)').forEach(function (a) { a.classList.toggle('on', !!id && a.getAttribute('href') === '#' + id); });
  }

  var locked = false;
  function go(i) {
    i = Math.max(0, Math.min(snapSecs.length - 1, i));
    var s = snapSecs[i];
    var off = (hdr && s.offsetTop > 10) ? 0 : 0;
    locked = true;
    W.scrollTo({ top: s.offsetTop - off, behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(function () { locked = false; }, 950);
  }

  /* auto-scroll: uma "rolagem" = uma seção (somente desktop com mouse) */
  var auto = cfg.autoscroll === 'sections' && !reduce && snapSecs.length > 1;
  if (auto) {
    var wheelAcc = 0, wheelT;
    W.addEventListener('wheel', function (e) {
      if (e.ctrlKey || W.innerWidth < 1024 || D.body.classList.contains('nav-open')) return;
      if (e.target.closest && e.target.closest('input,textarea,select,[data-noscroll]')) return;
      if (locked) { e.preventDefault(); return; }
      var i = cur(), s = snapSecs[i], dir = e.deltaY > 0 ? 1 : -1;
      var top = s.offsetTop, bottom = top + s.offsetHeight, vh = W.innerHeight;
      var y = W.scrollY;
      // seção mais alta que a tela: deixa rolar normalmente até a borda
      if (dir > 0 && bottom - (y + vh) > 8) return;
      if (dir < 0 && y - top > 8 && s.offsetHeight > vh) return;
      wheelAcc += Math.abs(e.deltaY); clearTimeout(wheelT); wheelT = setTimeout(function () { wheelAcc = 0; }, 160);
      if (wheelAcc < 25) { e.preventDefault(); return; }
      var next = i + dir;
      if (next < 0 || next >= snapSecs.length) return;
      e.preventDefault(); wheelAcc = 0;
      // ao descer para seção alta, vai para o topo dela; ao subir, vai para o fim da anterior se for alta
      if (dir < 0 && snapSecs[next].offsetHeight > vh) {
        locked = true; W.scrollTo({ top: snapSecs[next].offsetTop + snapSecs[next].offsetHeight - vh, behavior: 'smooth' });
        setTimeout(function () { locked = false; }, 950);
      } else go(next);
    }, { passive: false });
    W.addEventListener('keydown', function (e) {
      if (/input|textarea|select/i.test((e.target.tagName || '')) || W.innerWidth < 1024) return;
      if (['PageDown', 'PageUp'].indexOf(e.key) < 0) return;
      e.preventDefault(); if (!locked) go(cur() + (e.key === 'PageDown' ? 1 : -1));
    });
    D.documentElement.style.scrollBehavior = 'auto';
  }

  /* links âncora com rolagem suave */
  D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id || id === 'top') { if (id === 'top') { e.preventDefault(); W.scrollTo({ top: 0, behavior: 'smooth' }); } return; }
    var t = D.getElementById(id);
    if (t) { e.preventDefault(); W.scrollTo({ top: t.offsetTop, behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', '#' + id); }
  });

  /* lightbox */
  var lbx = D.getElementById('lbx');
  D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-lb]');
    if (a && lbx) { e.preventDefault(); lbx.innerHTML = '<img alt="" src="' + a.href + '">'; lbx.classList.add('open'); }
    else if (lbx && lbx.classList.contains('open')) lbx.classList.remove('open');
  });
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lbx) lbx.classList.remove('open'); });

  W.addEventListener('scroll', onScroll, { passive: true });
  W.addEventListener('resize', mark);
  onScroll();
})();

<?php
declare(strict_types=1);
require __DIR__ . '/../inc/render.php';
if (!is_logged_in()) { http_response_code(401); exit('Faça login.'); }
$site = load_site();
$b = base_url();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="<?= esc(fonts_link($site)) ?>">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">
<link rel="stylesheet" href="<?= $b ?>/assets/site.css?v=<?= time() ?>">
<script src="https://cdn.tailwindcss.com"></script>
<style id="dyn"></style>
<style>
 #hdr{position:absolute}
 [data-sid],[data-cid],[data-wid]{cursor:pointer}
 [data-sid]:hover{outline:2px dashed rgba(99,102,241,.55);outline-offset:-2px}
 [data-cid]:hover{outline:1px dashed rgba(16,185,129,.8);outline-offset:-1px}
 [data-wid]:hover{outline:1px dashed rgba(245,158,11,.9);outline-offset:2px}
 .__sel{outline:2px solid #6366f1!important;outline-offset:-2px;box-shadow:inset 0 0 0 9999px rgba(99,102,241,.05)}
 .__sel[data-wid]{outline-offset:2px;box-shadow:none}
 .__sel[data-cid]{outline-color:#10b981!important}
 .__sel[data-wid]{outline-color:#f59e0b!important}
 .ph{background:rgba(255,255,255,.4)}
</style>
</head>
<body>
<div id="page"></div>
<script>
(function(){
  var page=document.getElementById('page'),dyn=document.getElementById('dyn'),sel=null;
  function mark(){
    document.querySelectorAll('.__sel').forEach(function(e){e.classList.remove('__sel')});
    if(!sel)return;
    var q=sel.kind==='section'?'[data-sid="':sel.kind==='column'?'[data-cid="':'[data-wid="';
    var el=document.querySelector(q+sel.id+'"]'); if(el)el.classList.add('__sel');
  }
  window.addEventListener('message',function(e){
    var d=e.data||{};
    if(d.type==='render'){dyn.textContent=d.css;page.innerHTML=d.html;mark();}
    if(d.type==='select'){sel=d.sel;mark();
      if(d.scroll){var el=document.querySelector('.__sel');if(el){var r=el.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight)window.scrollTo({top:scrollY+r.top-100,behavior:'smooth'});}}}
  });
  document.addEventListener('click',function(e){
    var a=e.target.closest('a'); if(a)e.preventDefault();
    var w=e.target.closest('[data-wid]'),c=e.target.closest('[data-cid]'),s=e.target.closest('[data-sid]');
    var t=w?{kind:'widget',id:w.dataset.wid}:c?{kind:'column',id:c.dataset.cid}:s?{kind:'section',id:s.dataset.sid}:null;
    if(t){sel=t;mark();parent.postMessage({type:'select',sel:t},'*');}
  },true);
  document.addEventListener('submit',function(e){e.preventDefault()},true);
  parent.postMessage({type:'ready'},'*');
})();
</script>
</body>
</html>

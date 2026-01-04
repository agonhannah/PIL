(function () {
  var menuBtn = document.getElementById('menuBtn');
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('overlay');
  var badge = document.getElementById('jsBadge');

  // JS生存確認（目で分かる）
  if (badge) badge.textContent = 'JS: ON';

  function openDrawer(){
    if (!drawer) return;
    drawer.classList.add('is-open');
    document.body.classList.add('is-locked');
    if (overlay) overlay.hidden = false;
    if (menuBtn) menuBtn.setAttribute('aria-expanded','true');
    drawer.setAttribute('aria-hidden','false');
  }

  function closeDrawer(){
    if (!drawer) return;
    drawer.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (overlay) overlay.hidden = true;
    if (menuBtn) menuBtn.setAttribute('aria-expanded','false');
    drawer.setAttribute('aria-hidden','true');
  }

  if (menuBtn) menuBtn.addEventListener('click', openDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  document.addEventListener('click', function(e){
    // data-close が押されたら閉じる
    var t = e.target;
    while (t && t !== document.body) {
      if (t.hasAttribute && t.hasAttribute('data-close')) { closeDrawer(); return; }
      t = t.parentNode;
    }
  }, true);

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeDrawer();
  });

  // Pointer FX（最低限：動いたら出る）
  var fx = document.getElementById('pointer-fx');
  function showFx(){ if (fx) fx.style.opacity = '1'; }
  function hideFx(){ if (fx) fx.style.opacity = '0'; }
  function moveFx(x,y){ if (fx) fx.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }

  if (fx) {
    window.addEventListener('mousemove', function(e){
      showFx(); moveFx(e.clientX, e.clientY);
    }, {passive:true});

    window.addEventListener('touchstart', function(e){
      var t = e.touches && e.touches[0];
      if (!t) return;
      showFx(); moveFx(t.clientX, t.clientY);
      setTimeout(hideFx, 900);
    }, {passive:true});

    window.addEventListener('touchmove', function(e){
      var t = e.touches && e.touches[0];
      if (!t) return;
      showFx(); moveFx(t.clientX, t.clientY);
    }, {passive:true});
  }

})();
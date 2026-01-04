(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  // year
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  // elements
  const menuBtn = $('#menuBtn');
  const drawer = $('#drawer');
  const overlay = $('#overlay');
  const panelStack = $('#panelStack');
  const preview = $('#drawerPreview');

  // panel history (for slide)
  let stack = ['main'];

  function setBodyLock(on){
    document.body.classList.toggle('is-locked', on);
  }

  function setAriaOpen(isOpen){
    menuBtn?.setAttribute('aria-expanded', String(isOpen));
    drawer?.setAttribute('aria-hidden', String(!isOpen));
    if (overlay) overlay.hidden = !isOpen;
  }

  function openDrawer(){
    drawer.classList.add('is-open');
    setBodyLock(true);
    setAriaOpen(true);
  }

  function closeDrawer(){
    drawer.classList.remove('is-open');
    setBodyLock(false);
    setAriaOpen(false);

    // reset to main
    stack = ['main'];
    updatePanels();
    closeAllAcc();
    setPreview(null);
  }

  function setPreview(url){
    if (!preview) return;
    if (!url){
      preview.classList.remove('is-on');
      preview.style.backgroundImage = '';
      return;
    }
    preview.style.backgroundImage = `url("${url}")`;
    preview.classList.add('is-on');
  }

  function updatePanels(){
    const active = stack[stack.length - 1];
    $$('.panel', panelStack).forEach(p => {
      const name = p.getAttribute('data-panel');
      p.classList.remove('is-active', 'is-left');
      if (name === active) p.classList.add('is-active');
    });
    // mark previous panel as left (for better feel)
    if (stack.length >= 2){
      const prev = stack[stack.length - 2];
      const prevEl = $(`.panel[data-panel="${prev}"]`, panelStack);
      if (prevEl) prevEl.classList.add('is-left');
    }
  }

  // accordion like HYKE
  function closeAllAcc(){
    $$('.accRow').forEach(r => r.classList.remove('is-open'));
  }
  function toggleAcc(key){
    const row = $(`[data-acc="${key}"]`)?.closest('.accRow');
    if (!row) return;
    const open = row.classList.contains('is-open');
    // HYKEっぽく「同時に複数開く」もアリだが、ここは1つだけ開く
    closeAllAcc();
    if (!open) row.classList.add('is-open');
  }

  // open / close events
  menuBtn?.addEventListener('click', () => openDrawer());
  overlay?.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  // drawer click delegation
  drawer.addEventListener('click', (e) => {
    const t = e.target;

    // close
    if (t.matches('[data-close]') || t.closest('[data-close]')){
      closeDrawer();
      return;
    }

    // accordion
    const accBtn = t.closest('[data-acc]');
    if (accBtn){
      const key = accBtn.getAttribute('data-acc');
      toggleAcc(key);
      return;
    }

    // open panel (slide in)
    const openBtn = t.closest('[data-open-panel]');
    if (openBtn){
      const next = openBtn.getAttribute('data-open-panel');
      if (!next) return;

      // preview
      const cover = openBtn.getAttribute('data-cover');
      setPreview(cover);

      stack.push(next);
      updatePanels();
      return;
    }

    // back
    const backBtn = t.closest('[data-back]');
    if (backBtn){
      if (stack.length > 1) stack.pop();
      updatePanels();
      // preview update based on current panel's first cover (optional)
      const active = stack[stack.length - 1];
      if (active === 'main') setPreview(null);
      return;
    }

    // hover preview on links (tapでも一応）
    const coverLink = t.closest('[data-cover]');
    if (coverLink){
      const cover = coverLink.getAttribute('data-cover');
      setPreview(cover);
    }
  }, { passive:true });

  // initial aria
  setAriaOpen(false);
  updatePanels();

  /* ============ Pointer FX (restore) ============ */
  const fx = $('#pointer-fx');
  const lockbox = $('#lockbox');

  if (fx){
    let hideTimer = null;

    const show = () => { fx.style.opacity = '1'; };
    const hide = () => { fx.style.opacity = '0'; };

    const moveTo = (x, y) => {
      fx.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    // mouse
    window.addEventListener('mousemove', (e) => {
      show();
      moveTo(e.clientX, e.clientY);
    }, { passive:true });

    window.addEventListener('mouseleave', () => hide());

    // touch
    const touchMove = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      show();
      moveTo(t.clientX, t.clientY);

      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => hide(), 900);
    };

    window.addEventListener('touchstart', touchMove, { passive:true });
    window.addEventListener('touchmove', touchMove, { passive:true });

    // lockbox on drawer open (optional tiny hint)
    const hint = () => {
      if (!lockbox) return;
      lockbox.style.opacity = '1';
      setTimeout(() => (lockbox.style.opacity = '0'), 600);
    };
    menuBtn?.addEventListener('click', hint);
  }
})();
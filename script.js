// script.js (drawer first / pointerFX is your current one)

// Drawer: simple panel navigation (no back button, HYKE-like)
(function(){
  var menuBtn = document.getElementById("menuBtn");
  var drawer  = document.getElementById("drawer");
  var overlay = document.getElementById("overlay");
  var stack   = document.getElementById("drawerStack");
  if (!menuBtn || !drawer || !overlay || !stack) return;

  var panelHistory = [];
  var lastFocusEl = null;

  function setExpanded(isOpen){
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  }

  function getActivePanel(){ return stack.querySelector(".drawer__panel.is-active"); }
  function getActivePanelName(){
    var p = getActivePanel();
    return (p && p.dataset) ? p.dataset.panel : "main";
  }
  function getPanelByName(name){
    return stack.querySelector('.drawer__panel[data-panel="' + name + '"]');
  }

  function setPanel(name){
    var panels = stack.querySelectorAll(".drawer__panel");
    for (var i=0;i<panels.length;i++){
      var panel = panels[i];
      var isActive = panel.dataset && panel.dataset.panel === name;
      panel.classList.toggle("is-active", isActive);
    }
  }

  function goPanel(next){
    var current = getActivePanelName();
    if (current !== next) panelHistory.push(current);
    setPanel(next);
  }

  function openDrawer(){
    panelHistory = [];
    lastFocusEl = document.activeElement || menuBtn;

    setPanel("main");
    drawer.classList.add("is-open");
    overlay.hidden = false;
    document.body.classList.add("is-locked");
    setExpanded(true);
  }

  function closeDrawer(){
    panelHistory = [];
    drawer.classList.remove("is-open");
    overlay.hidden = true;
    document.body.classList.remove("is-locked");
    setExpanded(false);

    requestAnimationFrame(function(){
      if (lastFocusEl && lastFocusEl.focus) lastFocusEl.focus();
      else menuBtn.focus();
    });
  }

  function goBack(){
    var prev = panelHistory.pop() || "main";
    setPanel(prev);
  }

  // open / close
  menuBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);

  window.addEventListener("keydown", function(e){
    if (e.key === "Escape" && drawer.classList.contains("is-open")){
      e.preventDefault();
      closeDrawer();
    }
    // iOSでも戻れるように：Backspace/ArrowLeftは無し。必要なら追加。
  });

  // panel open buttons
  var openBtns = stack.querySelectorAll("[data-open-panel]");
  for (var i=0;i<openBtns.length;i++){
    (function(btn){
      btn.addEventListener("click", function(){
        var next = btn.dataset ? btn.dataset.openPanel : null;
        if (!next) return;
        goPanel(next);
      });
    })(openBtns[i]);
  }

  // close buttons
  var closeBtns = stack.querySelectorAll("[data-close]");
  for (var k=0;k<closeBtns.length;k++){
    closeBtns[k].addEventListener("click", function(){
      // sub panelなら一段戻る / mainなら閉じる（HYKEっぽい挙動）
      if (getActivePanelName() !== "main") goBack();
      else closeDrawer();
    });
  }
})();

// year
(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// drawer
(() => {
  const menuBtn = document.getElementById("menuBtn");
  const drawer  = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  if (!menuBtn || !drawer || !overlay) return;

  const closeBtn = drawer.querySelector("[data-close]");

  function setExpanded(isOpen){
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  }

  function openDrawer(){
    drawer.classList.add("is-open");
    overlay.hidden = false;
    document.body.classList.add("is-locked");
    setExpanded(true);
  }

  function closeDrawer(){
    drawer.classList.remove("is-open");
    overlay.hidden = true;
    document.body.classList.remove("is-locked");
    setExpanded(false);
  }

  menuBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")){
      e.preventDefault();
      closeDrawer();
    }
  });

  // accordion
  const rows = drawer.querySelectorAll("[data-acc]");
  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const key = row.getAttribute("data-acc");
      const sub = drawer.querySelector(`[data-sub="${key}"]`);
      if (!sub) return;

      const isOpen = row.getAttribute("aria-expanded") === "true";
      row.setAttribute("aria-expanded", String(!isOpen));
      sub.hidden = isOpen;
    });
  });
})();

/* ここに、あなたの PointerFX のJS全文をそのまま貼り付けてOK */

/*
  ==============================
  Pointer FX
  ==============================
  あなたの「今の pointerFX JS」をこの下にそのまま貼ってOK
*/
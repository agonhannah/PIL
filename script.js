// ==============================
// year
// ==============================
var yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==============================
// Drawer (right / fullscreen)
// - panel navigation (history)
// - ESC close
// - focus restore + basic focus trap
// ==============================
(function () {
  var menuBtn = document.getElementById("menuBtn");
  var drawer  = document.getElementById("drawer");
  var overlay = document.getElementById("overlay");

  if (!menuBtn || !drawer || !overlay) return;

  var panelHistory = [];
  var lastFocusEl = null;

  function setExpanded(isOpen) {
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  }

  function getActivePanel() {
    return drawer.querySelector(".drawer__panel.is-active");
  }

  function getActivePanelName() {
    var p = getActivePanel();
    return p && p.dataset ? p.dataset.panel : "main";
  }

  function getPanelByName(name) {
    return drawer.querySelector('.drawer__panel[data-panel="' + name + '"]');
  }

  function setPanel(name) {
    var panels = drawer.querySelectorAll(".drawer__panel");
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      var isActive = panel.dataset && panel.dataset.panel === name;
      panel.classList.toggle("is-active", isActive);
    }
  }

  function focusFirstFocusable() {
    var active = getActivePanel();
    if (!active) return;

    var closeBtn = active
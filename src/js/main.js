// App bootstrap and centralized UI event delegation
function wireGlobalUiEvents() {
  document.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    switch (action) {
      case 'close-edit-modal':
        closeEditModal();
        break;
      case 'save-player-changes':
        savePlayerChanges();
        break;
      case 'close-login-modal':
        closeLoginModal();
        break;
      case 'attempt-login':
        attemptLogin();
        break;
      case 'fill-demo':
        fillDemo(actionEl.dataset.type);
        break;
      case 'register-athlete':
        closeLoginModal();
        startPlayerOnboarding();
        break;
      case 'open-login-modal':
        openLoginModal();
        break;
      case 'demo-login':
        demoLogin(actionEl.dataset.mode);
        break;
      case 'close-onboarding':
        closeOnboarding();
        break;
      case 'next-ob-step':
        nextObStep(Number(actionEl.dataset.step));
        break;
      case 'finish-onboarding':
        finishOnboarding();
        break;
      case 'select-answer':
        selectAnswer(actionEl.dataset.q, actionEl.dataset.a);
        break;
      case 'show-page':
        showPage(actionEl.dataset.page, actionEl);
        break;
      case 'show-alert':
        alert(actionEl.dataset.message || 'Próximamente...');
        break;
      case 'logout':
        logout();
        break;
      case 'return-dashboard':
        showPage(
          'dt-dashboard',
          document.querySelector('#sidebar-dt .hud-nav-item.active') || document.querySelector('#sidebar-dt .hud-nav-item')
        );
        break;
      case 'cycle-manager-academy':
        cycleManagerAcademy();
        break;
      case 'toggle-academy':
        toggleAcademy(actionEl.dataset.colId, actionEl);
        break;
      case 'open-manager-academy':
        openManagerAcademy(actionEl.dataset.academyName);
        break;
      case 'view-player-manager':
        viewPlayerAsManager(actionEl.dataset.playerId);
        break;
      default:
        break;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLoginModal({ target: document.getElementById('login-modal-overlay') });
    }
  });

  const loginOverlay = document.getElementById('login-modal-overlay');
  if (loginOverlay) {
    loginOverlay.addEventListener('click', (event) => closeLoginModal(event));
  }
}

window.onload = () => {
  initIcons();
  wireGlobalUiEvents();

  // Pre-load demo data if missing.
  if (typeof initMockDB === 'function') initMockDB();
};

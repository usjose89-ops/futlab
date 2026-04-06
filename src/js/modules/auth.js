// Auth, onboarding, and app shell module
function openLoginModal() {
  document.getElementById('login-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('login-email').focus(), 100);
}
function closeLoginModal(event) {
  if (!event || event.target === document.getElementById('login-modal-overlay')) {
    document.getElementById('login-modal-overlay').classList.remove('open');
  }
}

// Rellena el modal con credenciales de demo
function fillDemo(type) {
  const emailMap = {
    manager: 'dt@futlab.cl',
    sub30:   'jugador1@futlab.cl',
    sub14:   'jugador2@futlab.cl'
  };
  document.getElementById('login-email').value = emailMap[type] || '';
  document.getElementById('login-pass').value  = 'Chile2026';
}

// Click en tarjeta demo → abre modal con datos prellenados
function demoLogin(mode) {
  openLoginModal();
  if (mode === 'manager') {
    fillDemo('manager');
  } else {
    fillDemo('sub30');
  }
}

function attemptLogin() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  let dbStr = localStorage.getItem('FutLab_DB_V1');
  if (!dbStr && typeof initMockDB === 'function') { initMockDB(); dbStr = localStorage.getItem('FutLab_DB_V1'); }
  if (!dbStr) return;
  
  const db = JSON.parse(dbStr);
  const user = db.users.find(u => u.email === email && u.pass === pass);
  
  if (user) {
    document.getElementById('login-error').style.display = 'none';
    // Cerrar modal de login
    document.getElementById('login-modal-overlay').classList.remove('open');
    appState.currentUser = user;
    if (user.role === 'manager') {
      enterApp('dt');
    } else {
      loadPlayerProfile(user.profileId, db);
      enterApp('player');
    }
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}
// --- ONBOARDING ---
function startPlayerOnboarding() { document.getElementById('onboarding-modal').style.display = 'flex'; nextObStep(1); }
function closeOnboarding() { document.getElementById('onboarding-modal').style.display = 'none'; }
function nextObStep(step) { document.querySelectorAll('.ob-step').forEach(el => el.classList.remove('active')); document.getElementById('ob-step-' + step).classList.add('active'); }
function selectAnswer(q, a) { obAnswers[q] = a; if(q === 'q1') nextObStep(4); if(q === 'q2') nextObStep(5); if(q === 'q3') nextObStep(6); }

function finishOnboarding() {
  try {
    let name = document.getElementById('ob-name').value || 'Jugador Elite';
    let age = Number(document.getElementById('ob-age').value) || 18;
    let weight = Number(document.getElementById('ob-weight').value) || 70;
    let height = Number(document.getElementById('ob-height').value) || 175;
    let pos = document.getElementById('ob-pos').value;
    let themePref = document.getElementById('ob-theme-pref').value;
    
    let selectedTheme = 'gold'; // Default
    if (themePref === 'local') selectedTheme = 'futlab';
    else if (themePref === 'world') selectedTheme = 'rmadrid';

    // 1. Create Player Obj (Using new Stats Engine)
    const { stats, ovr, subattrs } = FootballStatsEngine.initNewPlayer(pos, 'amateur');
    
    const newPlayer = {
      id: 'P_' + Math.random().toString(36).substr(2, 9),
      name: name,
      age: age,
      height: height / 100,
      weight: weight,
      position: pos,
      foot: 'DERECHO',
      birthdate: `01/01/${2026 - age}`,
      stats: stats,
      ovr: ovr,
      status: FootballStatsEngine.getLevelLabel(ovr),
      wearables: { oura: 'ON', appleWatch: '100%', peto: 'ON' },
      fatigue: 100,
      payment: { plan: "Mensual", status: "Al Día" }
    };

    // 2. Add to DB
    const dbStr = localStorage.getItem('FutLab_DB_V1');
    if (dbStr) {
      const db = JSON.parse(dbStr);
      // Add to a "Nuevos Ingresos" academy (or create if missing)
      let aca = db.academies.find(a => a.id === 'NEW');
      if (!aca) {
        aca = { id: 'NEW', name: 'Nuevos Atletas', startDate: new Date().toISOString(), players: [] };
        db.academies.push(aca);
      }
      aca.players.push(newPlayer);
      
      // Add user record so they can login later with this dummy email
      const email = name.toLowerCase().replace(/\s/g, '') + '@futlab.cl';
      db.users.push({ email: email, pass: 'Chile2026', role: 'player', profileId: newPlayer.id });
      
      localStorage.setItem('FutLab_DB_V1', JSON.stringify(db));
      
      // 3. Set as current profile and enter app
      appState.profile = convertToLegacyProfile(newPlayer);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.profile));
    }
    
    document.getElementById('onboarding-modal').style.display = 'none';
    enterApp('player');
  } catch(e) { console.error("Error en Onboarding:", e); }
}

function convertToLegacyProfile(p) {
  return {
    Bio: { Nombre: p.name, Edad: p.age, Peso: p.weight, Estatura: p.height * 100, Pos: p.position, Foot: p.foot, Birthdate: p.birthdate },
    Stats: p.stats,
    Subattrs: p.subattrs,
    Theme: 'gold',
    Status: p.status,
    Wearables: p.wearables,
    Fatigue: p.fatigue,
    Ovr: p.ovr,
    SignDate: new Date().toLocaleDateString('es-ES')
  };
}
function enterApp(mode) {
  console.log("Iniciando HUD en modo:", mode);
  
  // 1. Ocultar pantalla de login de forma segura
  const loginScreen = document.getElementById('screen-login');
  if (loginScreen) {
    loginScreen.classList.remove('active');
    loginScreen.style.display = 'none';
  }
  
  // 2. Activar contenedor principal de la App
  const mainScreen = document.getElementById('screen-app');
  if (mainScreen) {
    mainScreen.classList.add('active');
    mainScreen.style.display = 'flex';
  } else {
    console.error("ERROR CRÍTICO: No se encontró el contenedor #screen-app en el HTML");
    return;
  }
  
  // 3. Resetear visibilidad de SIDEBARS y TOPNAVS
  const elementsToHide = ['sidebar-dt', 'topnav-dt', 'sidebar-player', 'topnav-player'];
  elementsToHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // 4. Configurar según rol
  if (mode === 'dt') {
    const sDt = document.getElementById('sidebar-dt');
    const tDt = document.getElementById('topnav-dt');
    if (sDt) sDt.style.display = 'flex';
    if (tDt) tDt.style.display = 'flex';
    
    // Navegar al Dashboard y renderizar Kanban
    showPage('dt-dashboard', document.querySelector('#sidebar-dt .hud-nav-item.active') || document.querySelector('#sidebar-dt .hud-nav-item'));
  } else {
    const sPl = document.getElementById('sidebar-player');
    const tPl = document.getElementById('topnav-player');
    if (sPl) sPl.style.display = 'flex';
    if (tPl) tPl.style.display = 'flex';
    
    updatePlayerUI();
    showPage('pl-profile', document.getElementById('nav-pl-profile'));
  }
  
  initIcons();
}

function logout() {
  const appScreen = document.getElementById('screen-app');
  if (appScreen) appScreen.classList.remove('active');
  
  const loginScreen = document.getElementById('screen-login');
  if (loginScreen) {
    loginScreen.classList.add('active');
    loginScreen.style.display = 'block';
  }
  
  // Resetear tema
  document.documentElement.style.setProperty('--team-primary', '#38bdf8');
}

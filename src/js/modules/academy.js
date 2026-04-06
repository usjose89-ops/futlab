// Manager academy and navigation module
function showPage(id, navEl) {
  console.log("Cambiando a página:", id);
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if(page) page.classList.add('active');
  if (typeof syncPlayerTopTabs === 'function' && id.startsWith('pl-')) {
    syncPlayerTopTabs(id);
  }
  
  if(navEl) {
    const parent = navEl.closest('.sidebar') || navEl.closest('.hud-sidebar');
    if(parent) {
      parent.querySelectorAll('.nav-item, .hud-nav-item').forEach(n => n.classList.remove('active'));
      navEl.classList.add('active');
    }
  }

  // Robust Delay for rendering
  setTimeout(() => {
    initIcons();
    if(id === 'dt-dashboard') renderRegionalKanban();
    if(id === 'dt-academy') renderManagerAcademyPanel();
    if(id === 'pl-evolution') renderPlayerOverall();
    if(id === 'pl-training' && typeof updateRoutine === 'function') updateRoutine();
    if(id === 'pl-profile' && appState.profile) {
      renderRadar(appState.profile.Stats, THEME_PALETTES[appState.profile.Theme]?.primary || '#38bdf8');
      // Update label if exists
      const label = document.getElementById('hud-status-label');
      if(label) label.innerText = FootballStatsEngine.getLevelLabel(appState.profile.Ovr);
    }
  }, 50);
}

function getManagerAcademies(db) {
  const source = Array.isArray(db?.academies) ? db.academies : [];
  const preferredOrder = ['LAS CONDES', 'ÑUÑOA', 'PROVIDENCIA', 'VITACURA'];
  const normalized = new Map(source.map(a => [(a.name || '').toUpperCase(), a]));
  const ordered = preferredOrder
    .map(name => normalized.get(name))
    .filter(Boolean);

  source.forEach(a => {
    if (!ordered.includes(a)) ordered.push(a);
  });

  return ordered;
}

function normalizeAcademyLabel(name) {
  if (!name) return 'Academia Elite Santiago';
  const title = name
    .toLowerCase()
    .split(' ')
    .map(part => part ? part[0].toUpperCase() + part.slice(1) : '')
    .join(' ')
    .trim();
  return `Academia Elite ${title}`;
}

function renderManagerAcademyPanel() {
  const dbStr = localStorage.getItem('FutLab_DB_V1');
  if (!dbStr) return;

  const db = JSON.parse(dbStr);
  const academies = getManagerAcademies(db);
  if (academies.length === 0) return;

  if (typeof appState.managerAcademyIndex !== 'number') appState.managerAcademyIndex = 0;
  if (appState.managerAcademyIndex >= academies.length) appState.managerAcademyIndex = 0;

  const academy = academies[appState.managerAcademyIndex];
  const players = Array.isArray(academy.players) ? academy.players : [];
  const avgOvr = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + (p.ovr || 0), 0) / players.length)
    : 0;

  setElementText('manager-academy-name', normalizeAcademyLabel(academy.name));
  setElementText('manager-academy-location', `${academy.name}, CL`);
  setElementText('manager-academy-id', `ID: FTL-${academy.id || '000'}-${(academy.name || 'STGO').replace(/\s+/g, '-').toUpperCase()}`);
  setElementText('manager-academy-count', players.length);
  setElementText('manager-academy-ovr', avgOvr || '—');

  const selectorLabel = document.getElementById('manager-academy-selector-label');
  if (selectorLabel) selectorLabel.textContent = `Selector de Academia (${appState.managerAcademyIndex + 1}/${academies.length})`;

  const pendingCount = Math.max(2, Math.min(9, Math.ceil(players.length / 8)));
  setElementText('academy-pending-pill', `${pendingCount} Pendientes`);

  const growthList = document.getElementById('academy-growth-list');
  if (growthList) {
    const topPlayers = [...players]
      .sort((a, b) => (b.ovr || 0) - (a.ovr || 0))
      .slice(0, 3);

    growthList.innerHTML = topPlayers.length > 0
      ? topPlayers.map((p, idx) => `
        <div class="academy-growth-row">
          <div class="academy-growth-avatar">
            <img src="assets/images/shared/jugador.jpg" alt="${p.name}">
            <span>${p.ovr || 0}</span>
          </div>
          <div class="academy-growth-info">
            <strong>${p.name}</strong>
            <small>${p.position || 'SIN POSICIÓN'}</small>
          </div>
          <div class="academy-growth-ovr">+${Math.max(1, 3 - idx)} OVR</div>
        </div>
      `).join('')
      : `<div class="academy-growth-empty">Sin jugadores registrados en esta academia.</div>`;
  }

  initIcons();
}

function cycleManagerAcademy() {
  const dbStr = localStorage.getItem('FutLab_DB_V1');
  if (!dbStr) return;
  const db = JSON.parse(dbStr);
  const academies = getManagerAcademies(db);
  if (academies.length < 2) return;

  const current = typeof appState.managerAcademyIndex === 'number' ? appState.managerAcademyIndex : 0;
  appState.managerAcademyIndex = (current + 1) % academies.length;
  renderManagerAcademyPanel();
}

function setManagerAcademyByName(name) {
  const dbStr = localStorage.getItem('FutLab_DB_V1');
  if (!dbStr) return;
  const db = JSON.parse(dbStr);
  const academies = getManagerAcademies(db);
  const index = academies.findIndex(a => (a.name || '').toUpperCase() === (name || '').toUpperCase());
  if (index === -1) return;
  appState.managerAcademyIndex = index;
  renderManagerAcademyPanel();
}

function openManagerAcademy(name) {
  setManagerAcademyByName(name);
  showPage('dt-academy', document.querySelector('#sidebar-dt .hud-nav-item.active') || document.querySelector('#sidebar-dt .hud-nav-item'));
}

function renderRegionalKanban() {
  const dbStr = localStorage.getItem('FutLab_DB_V1');
  if(!dbStr) return;
  const db = JSON.parse(dbStr);
  const board = document.getElementById('manager-regional-board');
  if(!board) return;
  
  const order = ['LAS CONDES', 'ÑUÑOA', 'PROVIDENCIA', 'VITACURA'];
  let html = '';

  order.forEach((acaName, idx) => {
    const aca = db.academies.find(a => a.name.toUpperCase() === acaName) || { name: acaName, players: [] };
    const players = aca.players || [];
    const safeAcademyNameAttr = (aca.name || '').replace(/"/g, '&quot;');
    const avgOvr = players.length > 0
      ? Math.round(players.reduce((s, p) => s + (p.ovr || 0), 0) / players.length)
      : 0;
    const colId = `academy-col-${idx}`;

    const playersHtml = players.map(p => `
      <div class="player-card-mini" data-action="view-player-manager" data-player-id="${p.id}">
        <div class="p-mini-img-wrap">
          <img src="assets/images/shared/jugador.jpg" alt="${p.name}">
          <div class="p-mini-ovr">${p.ovr}</div>
        </div>
        <div class="p-mini-info">
          <div class="p-mini-name">${p.name}</div>
          <div class="p-mini-pos">${p.position} <span class="p-mini-ovr-label">OVR ${p.ovr}</span></div>
        </div>
        <i data-lucide="chevron-right" style="width:14px; color:#64748b; flex-shrink:0;"></i>
      </div>
    `).join('');

    html += `
      <div class="regional-column">
        <div class="column-header collapsed" data-action="toggle-academy" data-col-id="${colId}">
          <div class="column-title-wrap">
            <div class="column-toggle-icon" id="icon-${colId}">
              <i data-lucide="chevron-right" style="width:16px; transition: transform 0.3s;"></i>
            </div>
            <h3 class="column-title">${aca.name}</h3>
            <button class="column-focus-btn" data-action="open-manager-academy" data-academy-name="${safeAcademyNameAttr}">
              <i data-lucide="target" style="width:12px;"></i>
              INGRESAR
            </button>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="column-stat">
              <span class="column-stat-val">${players.length}</span>
              <span class="column-stat-lbl">JUGADORES</span>
            </div>
            <div class="column-stat">
              <span class="column-stat-val" style="color:#00f5d4;">${avgOvr || '—'}</span>
              <span class="column-stat-lbl">OVR PROM.</span>
            </div>
            <span class="column-badge">${players.length} ${players.length === 1 ? 'ATLETA' : 'ATLETAS'}</span>
          </div>
        </div>
        <div class="academy-player-list" id="${colId}" style="display:none; flex-direction:column; gap:10px; padding: 10px 0;">
          ${players.length > 0 ? playersHtml : '<div style="color:#64748b; font-size:0.8rem; padding:16px; text-align:center;">Sin jugadores registrados</div>'}
        </div>
      </div>
    `;
  });
  
  board.innerHTML = html;
  initIcons();
}

function toggleAcademy(colId, headerEl) {
  const playerList = document.getElementById(colId);
  if (!playerList) return;
  
  const isExpanded = playerList.style.display === 'flex';
  
  if (isExpanded) {
    // Colapsar
    playerList.style.display = 'none';
    headerEl.classList.add('collapsed');
    const icon = document.querySelector(`#icon-${colId} i`);
    if (icon) icon.style.transform = 'rotate(0deg)';
  } else {
    // Expandir
    playerList.style.display = 'flex';
    headerEl.classList.remove('collapsed');
    const icon = document.querySelector(`#icon-${colId} i`);
    if (icon) icon.style.transform = 'rotate(90deg)';
    initIcons();
  }
}

function renderKanban() {
  // Legacy support or alias
  renderRegionalKanban();
}

function viewPlayerAsManager(playerId) {
  const dbStr = localStorage.getItem('FutLab_DB_V1');
  if(!dbStr) return;
  const db = JSON.parse(dbStr);
  
  loadPlayerProfile(playerId, db);
  updatePlayerUI();
  
  let backBtn = document.getElementById('manager-back-btn');
  if(!backBtn) {
    backBtn = document.createElement('button');
    backBtn.id = 'manager-back-btn';
    backBtn.className = 'btn btn-primary';
    backBtn.style.position = 'fixed';
    backBtn.style.bottom = '30px';
    backBtn.style.right = '30px';
    backBtn.style.zIndex = '9999';
    backBtn.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    backBtn.innerHTML = '← VOLVER AL KANBAN';
    backBtn.onclick = () => {
       showPage('dt-dashboard');
       backBtn.style.display = 'none';
       const editBtn = document.getElementById('manager-edit-btn');
       if(editBtn) editBtn.style.display = 'none';
       renderKanban(); 
    };
    document.body.appendChild(backBtn);
  }
  backBtn.style.display = 'block';

  showPage('pl-profile');

  // Add Edit Button if not present
  let editBtn = document.getElementById('manager-edit-btn');
  if(!editBtn) {
    editBtn = document.createElement('button');
    editBtn.id = 'manager-edit-btn';
    editBtn.className = 'btn btn-primary';
    editBtn.style.position = 'fixed';
    editBtn.style.bottom = '30px';
    editBtn.style.left = '320px'; // Next to sidebar
    editBtn.style.zIndex = '9999';
    editBtn.style.background = '#22c55e';
    editBtn.innerHTML = '✎ EDITAR FICHA';
    editBtn.onclick = () => openEditPlayerModal(playerId);
    document.body.appendChild(editBtn);
  }
  editBtn.style.display = 'block';
}

function openEditPlayerModal(playerId) {
  const db = JSON.parse(localStorage.getItem('FutLab_DB_V1'));
  let player = null;
  db.academies.forEach(a => {
    const found = a.players.find(p => p.id === playerId);
    if(found) player = found;
  });
  if(!player) return;

  appState.editingPlayerId = playerId;
  document.getElementById('edit-p-name').value = player.name;
  document.getElementById('edit-p-pos').value = player.position;
  document.getElementById('edit-p-weight').value = player.weight;
  document.getElementById('edit-p-height').value = Math.round(player.height * 100);
  
  document.getElementById('edit-s-ritmo').value = player.stats.Ritmo;
  document.getElementById('edit-s-tiro').value = player.stats.Tiro;
  document.getElementById('edit-s-pases').value = player.stats.Pases;
  document.getElementById('edit-s-regate').value = player.stats.Regate;
  document.getElementById('edit-s-defensa').value = player.stats.Defensa;
  document.getElementById('edit-s-fisico').value = player.stats['Físico'];

  document.getElementById('edit-player-modal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-player-modal').classList.remove('open');
}

function savePlayerChanges() {
  const id = appState.editingPlayerId;
  const db = JSON.parse(localStorage.getItem('FutLab_DB_V1'));
  let playerFound = null;
  
  db.academies.forEach(a => {
    const idx = a.players.findIndex(p => p.id === id);
    if(idx !== -1) {
      const p = a.players[idx];
      p.name = document.getElementById('edit-p-name').value;
      p.position = document.getElementById('edit-p-pos').value;
      p.weight = Number(document.getElementById('edit-p-weight').value);
      p.height = Number(document.getElementById('edit-p-height').value) / 100;
      
      p.stats.Ritmo = Number(document.getElementById('edit-s-ritmo').value);
      p.stats.Tiro = Number(document.getElementById('edit-s-tiro').value);
      p.stats.Pases = Number(document.getElementById('edit-s-pases').value);
      p.stats.Regate = Number(document.getElementById('edit-s-regate').value);
      p.stats.Defensa = Number(document.getElementById('edit-s-defensa').value);
      p.stats['Físico'] = Number(document.getElementById('edit-s-fisico').value);
      
      // Recalculate OVR
      let total = 0; for(let k in p.stats) total += p.stats[k];
      p.ovr = Math.round(total / 6);
      playerFound = p;
    }
  });

  if(playerFound) {
    localStorage.setItem('FutLab_DB_V1', JSON.stringify(db));
    closeEditModal();
    // Update current view if it's the same player
    loadPlayerProfile(id, db);
    updatePlayerUI();
    alert('Cambios guardados con éxito.');
  }
}

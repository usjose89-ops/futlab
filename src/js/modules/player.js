// Player profile and visualization module
function loadPlayerProfile(playerId, db) {
  let found = null;
  db.academies.forEach(aca => {
    const p = aca.players.find(pl => pl.id === playerId);
    if(p) found = p;
  });
  
  if(found) {
    appState.profile = {
      Bio: { 
        Nombre: found.name, 
        Edad: found.age, 
        Peso: found.weight, 
        Estatura: (found.height > 5 ? found.height : found.height * 100), // Handle meters vs cm
        Pos: found.position, 
        Avatar: null,
        Foot: found.foot || 'DERECHO',
        Birthdate: found.birthdate || '01/01/2000'
      },
      Stats: found.stats,
      Theme: found.colorTheme || 'gold', 
      Status: found.status,
      Wearables: found.wearables,
      Fatigue: found.fatigue,
      Ovr: found.ovr,
      Subattrs: found.subattrs
    };
    console.log("Perfil cargado en appState:", appState.profile.Bio.Nombre);
  } else {
    console.error("Jugador no encontrado:", playerId);
  }
}
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if(appState.profile && appState.profile.Bio) {
        appState.profile.Bio.Avatar = e.target.result;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.profile));
        renderAvatar();
      }
    }
    reader.readAsDataURL(file);
  }
}

function renderAvatar() {
  const bg = document.getElementById('card-portrait');
  const mini = document.getElementById('mini-avatar-container-pl');
  if (appState.profile && appState.profile.Bio && appState.profile.Bio.Avatar) {
    if(bg) bg.style.backgroundImage = `url('${appState.profile.Bio.Avatar}')`;
    if(mini) mini.innerHTML = `<img src="${appState.profile.Bio.Avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }
  // If no avatar, keep the default shared player image set in HTML
}

function updatePlayerUI() {
  try {
    const p = appState.profile;
    if(!p || !p.Bio) return;
    
    const theme = THEME_PALETTES[p.Theme] || THEME_PALETTES['futlab'];
    document.documentElement.style.setProperty('--team-primary', theme.primary);
    document.documentElement.style.setProperty('--team-glow', theme.bgTint);
    
    // Name
    let nameParts = p.Bio.Nombre.split(' ');
    setElementText('hud-name', `${nameParts[0] || ''}<br>${nameParts.slice(1).join(' ') || ''}`);
    setElementText('topnav-player-name', p.Bio.Nombre.toUpperCase());
    
    // OVR and Status
    const ovr = p.Ovr || 50;
    setElementText('hud-ovr', ovr);
    
    const statusEl = document.getElementById('hud-status-label');
    if(statusEl && typeof FootballStatsEngine !== 'undefined') {
      const label = FootballStatsEngine.getLevelLabel(ovr);
      statusEl.innerHTML = label.split(' ').map(w => w === 'AMATEUR' ? 'ESTATUS<br>AMATEUR' : w).join('<br>');
      // Special case for "AMATEUR MEDIO" etc, let's just make it look good
      if (label.includes('AMATEUR')) statusEl.innerHTML = 'ESTATUS<br>AMATEUR';
      else statusEl.innerHTML = label.split(' ').join('<br>');
    }

    // Foot, birthdate, position
    setElementText('hud-foot', p.Bio.Foot || 'DERECHO');
    setElementText('hud-birthdate', (p.Bio.Birthdate || '2010').split('-')[0]); // Just year for cleaner UI
    
    // Stars based on OVR
    const strongStars = ovr >= 80 ? '★★★★★' : ovr >= 70 ? '★★★★☆' : '★★★☆☆';
    const weakStars   = ovr >= 75 ? '★★★☆☆' : '★★☆☆☆';
    setElementText('hud-stars-strong', strongStars);
    setElementText('hud-stars-weak', weakStars);
    
    // Positions (use pos from Bio or defaults by position)
    const posMap = {
      'DC': { primary: 'DC (Delantero Centro)', secondary: 'ED (Extremo Derecho)' },
      'ED': { primary: 'ED (Extremo Derecho)', secondary: 'DC (Delantero Centro)' },
      'MC': { primary: 'Mediocampista Central', secondary: 'Mediocampista Ofensivo' },
      'MO': { primary: 'Mediocampista Ofensivo', secondary: 'Mediocampista Central' },
      'LD': { primary: 'Lateral Derecho', secondary: 'Mediocampista Derecho' },
      'LI': { primary: 'Lateral Izquierdo', secondary: 'Extremo Izquierdo' },
      'DFC': { primary: 'Defensa Central', secondary: 'Lateral Derecho' },
      'PO': { primary: 'Portero', secondary: 'Portero' },
    };
    const pm = posMap[p.Bio.Pos] || { primary: p.Bio.Pos || 'MX', secondary: 'Polivalente' };
    setElementText('hud-pos-primary', pm.primary);
    setElementText('hud-pos-secondary', pm.secondary);
    
    // Biometría
    let heightM = (p.Bio.Estatura / 100).toFixed(2);
    let imc = (p.Bio.Peso / Math.pow(parseFloat(heightM), 2)).toFixed(1);
    setElementText('bio-val-imc', imc);
    setElementText('bio-val-alt', heightM);
    setElementText('bio-val-peso', p.Bio.Peso.toFixed(0));
    const fillImc = document.getElementById('bio-fill-imc');
    if(fillImc) fillImc.style.width = Math.min(100, Math.max(10, (imc/30)*100)) + '%';
    
    // Pulso simulado
    const pulso = 48 + Math.floor(Math.random() * 18);
    setElementText('bio-val-pulso', pulso + ' LPM');
    
    // Matches (Simulated)
    const f5 = 12;
    const f7 = 24;
    const f11 = 8;
    setElementText('pm-f5', f5);
    setElementText('pm-f7', f7);
    setElementText('pm-f11', f11);
    setElementText('pm-total', (f5+f7+f11) + ' Partidos');
    
    // Fatigue
    const fatigue = p.Fatigue || (75 + Math.floor(Math.random() * 20));
    const fatiguePath = document.getElementById('fatigue-path');
    if(fatiguePath) fatiguePath.setAttribute('stroke-dasharray', `${fatigue}, 100`);
    setElementText('hud-fatigue-pct', fatigue + '%');
    const fatigueLabel = fatigue >= 85 ? 'Recuperación Lista' : fatigue >= 70 ? 'En Recuperación' : 'Recuperación Baja';
    setElementText('hud-fatigue-label', fatigueLabel);
    
    // Avatar
    renderAvatar();
    
    // Build sub-stats grid
    renderStatsGrid(p.Stats, ovr, p.Subattrs);
    
    // Radar
    requestAnimationFrame(() => {
      renderRadar(p.Stats, theme.primary);
      if(radarChart) radarChart.resize(); 
    });

    initIcons();
    initIcons();

    // History
    renderHistory();
  } catch(e) { console.error("Error en Update UI:", e); }
}

function renderHistory() {
  const dbStr = localStorage.getItem('FutLab_DB_V1');
  if(!dbStr) return;
  const db = JSON.parse(dbStr);
  const container = document.getElementById('routine-content'); // Reusing this for demo history
  if(!container) return;

  if(!db.history) return;

  let html = `<div style="background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05); overflow:hidden;">
    <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
      <thead style="background:rgba(255,255,255,0.05);">
        <tr>
          <th style="padding:10px;text-align:left;color:var(--text-muted);">FECHA</th>
          <th style="padding:10px;text-align:left;color:var(--text-muted);">FOCO</th>
          <th style="padding:10px;text-align:right;color:var(--text-muted);">DURACIÓN</th>
        </tr>
      </thead>
      <tbody>`;
  
  db.history.slice(0, 5).forEach(h => {
    html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
      <td style="padding:10px;color:#fff;font-weight:700;">${new Date(h.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</td>
      <td style="padding:10px;color:var(--text-muted);">${h.focus}</td>
      <td style="padding:10px;text-align:right;color:#22c55e;font-weight:800;">${h.duration}</td>
    </tr>`;
  });
  
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderStatsGrid(stats, ovr, subs) {
  const grid = document.getElementById('prf-stats-grid');
  if(!grid) return;
  
  // Use real subattrs if available, or fall back to "invented" ones
  const subStats = {
    'Ritmo':   [['Aceleración', subs?.ace || Math.min(99, stats.Ritmo + 2)], ['V. Sprint', subs?.spr || Math.min(99, stats.Ritmo - 1)]],
    'Tiro':    [['Finalización', subs?.fin || stats.Tiro], ['Potencia', subs?.pot || Math.min(99, stats.Tiro + 2)]],
    'Pases':   [['Visión', subs?.vis || Math.min(99, stats.Pases + 2)], ['Pase Corto', subs?.pas || stats.Pases]],
    'Regate':  [['Control', subs?.con || Math.min(99, stats.Regate + 1)], ['Regates', subs?.reg || Math.min(99, stats.Regate + 1)]],
    'Defensa': [['Intercep.', subs?.int || Math.min(99, stats.Defensa + 3)], ['Entradas', subs?.ent || Math.min(99, stats.Defensa - 4)]],
    'Físico':  [['Resistencia', subs?.res || Math.min(99, stats.Físico + 3)], ['Fuerza', subs?.fue || stats.Físico]],
  };

  const display = [
    ['Ritmo', stats.Ritmo || ovr],
    ['Pases', stats.Pases || ovr],
    ['Tiro', stats.Tiro || Math.round(ovr * 0.85)],
    ['Regate', stats.Regate || ovr],
    ['Defensa', stats.Defensa || Math.round(ovr * 0.65)],
    ['Físico', stats['Físico'] || stats.Físico || ovr]
  ];

  let html = '';
  display.forEach(([attr, val]) => {
    const s = subStats[attr] || [];
    const colorClass = 'prf-sub-val-good'; // Keep it positive for motivation
    html += `
      <div class="prf-stat-col">
        <div class="prf-stat-header">
          <span class="prf-stat-name">${attr.toUpperCase()}</span>
          <span class="prf-stat-main-val">${Math.round(val)}</span>
        </div>
        ${s.map(([sn, sv]) => `
          <div class="prf-sub-row">
            <span class="prf-sub-name">${sn}</span>
            <span class="${colorClass}">${Math.round(sv)}</span>
          </div>
        `).join('')}
      </div>
    `;
  });
  
  grid.innerHTML = html;
  grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
}

function renderRadar(stats, colorHex) {
  const canvas = document.getElementById('chart-radar');
  if(!canvas) { console.error("Canvas radar no encontrado"); return; }
  
  if (typeof Chart === 'undefined') { console.error("Chart.js no cargado"); return; }

  // Extra safety on color
  if(!colorHex || colorHex === '#ffffff') colorHex = '#f59e0b'; // Gold fallback

  const catOrder = ['Ritmo', 'Tiro', 'Pases', 'Defensa', 'Físico', 'Regate'];
  const values = catOrder.map(k => stats[k] || 0);
  
  console.log("Renderizando Radar:", values);

  if(radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, {
    type: 'radar',
    data: { 
      labels: catOrder.map(l => l.toUpperCase()), 
      datasets: [{ 
        data: values, 
        backgroundColor: colorHex + '44', 
        borderColor: colorHex, 
        borderWidth: 3, 
        pointBackgroundColor: colorHex, 
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4, 
        pointHoverRadius: 6,
        fill: true
      }] 
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      layout: { padding: 5 }, 
      scales: { 
        r: { 
          min: 0, 
          max: 100, 
          beginAtZero: true,
          ticks: { display: false, stepSize: 20 }, 
          grid: { color: 'rgba(255,255,255,0.2)', circular: false }, 
          angleLines: { color: 'rgba(255,255,255,0.2)' }, 
          pointLabels: { color: '#f8fafc', font: { size: 10, weight: '700', family: 'Satoshi' }, padding: 8 } 
        } 
      }, 
      plugins: { legend: { display: false } } 
    }
  });
}

function renderPlayerOverall() {
  const canvas = document.getElementById('chart-player-overall');
  if(!canvas) { console.error("Canvas overall no encontrado"); return; }
  if (typeof Chart === 'undefined') return;

  const data = [68, 70, 72, 75, 74, 78, 80, 82]; 
  const labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--team-primary').trim() || '#38bdf8';

  console.log("Renderizando Overall Progression");

  if(playerProgressChart) playerProgressChart.destroy();
  playerProgressChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Overall Projection',
        data: data,
        borderColor: primary,
        backgroundColor: primary + '33',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: primary
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false, min: 60, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

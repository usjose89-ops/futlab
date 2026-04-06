// Player profile and visualization module
function loadPlayerProfile(playerId, db) {
  let found = null;
  let academyName = 'FUTLAB SANTIAGO';

  db.academies.forEach((aca) => {
    const p = aca.players.find((pl) => pl.id === playerId);
    if (p) {
      found = p;
      academyName = `FUTLAB ${String(aca.name || 'SANTIAGO').toUpperCase()}`;
    }
  });

  if (found) {
    appState.profile = {
      Bio: {
        Nombre: found.name,
        Edad: found.age,
        Peso: found.weight,
        Estatura: found.height > 5 ? found.height : found.height * 100,
        Pos: found.position,
        Avatar: null,
        Foot: found.foot || 'DERECHO',
        Birthdate: found.birthdate || '2000-01-01'
      },
      Stats: found.stats,
      Theme: found.colorTheme || found.theme || 'rmadrid',
      Status: found.status,
      Wearables: found.wearables || {},
      Fatigue: found.fatigue,
      Ovr: found.ovr,
      Subattrs: found.subattrs,
      AcademyName: academyName
    };
  } else {
    console.error('Jugador no encontrado:', playerId);
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (!appState.profile || !appState.profile.Bio) return;
    appState.profile.Bio.Avatar = e.target.result;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.profile));
    renderAvatar();
  };
  reader.readAsDataURL(file);
}

function renderAvatar() {
  const bg = document.getElementById('card-portrait');
  const mini = document.getElementById('mini-avatar-container-pl');

  if (appState.profile && appState.profile.Bio && appState.profile.Bio.Avatar) {
    if (bg) bg.style.backgroundImage = `url('${appState.profile.Bio.Avatar}')`;
    if (mini) {
      mini.innerHTML = `<img src="${appState.profile.Bio.Avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
  }
}

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ')
    .trim();
}

function getBirthYear(birthdate) {
  if (!birthdate) return '2004';
  const text = String(birthdate);
  const yearMatch = text.match(/(19|20)\d{2}/);
  return yearMatch ? yearMatch[0] : '2004';
}

function getTopRoleLabel(pos) {
  const map = {
    DC: 'DELANTERO / ED',
    ED: 'EXTREMO / DC',
    EI: 'EXTREMO / DC',
    MC: 'MEDIOCAMPO / MO',
    MO: 'VOLANTE OFENSIVO',
    DFC: 'DEFENSA / LD',
    LD: 'LATERAL / CARRILERO',
    LI: 'LATERAL / CARRILERO',
    PO: 'PORTERO'
  };
  return map[pos] || `${String(pos || 'JUGADOR')} / POLIVALENTE`;
}

function getPerformanceLevel(ovr) {
  const levels = [
    { name: 'FORMATIVO', min: 0, max: 64 },
    { name: 'AMATEUR FUERTE', min: 65, max: 74 },
    { name: 'COMPETITIVO', min: 75, max: 84 },
    { name: 'ELITE', min: 85, max: 100 }
  ];

  const current = levels.find((level) => ovr >= level.min && ovr <= level.max) || levels[1];
  const currentIdx = levels.indexOf(current);
  const next = levels[Math.min(currentIdx + 1, levels.length - 1)];
  const band = Math.max(1, current.max - current.min);
  const progress = Math.max(5, Math.min(99, Math.round(((ovr - current.min) / band) * 100)));

  return { current, next, progress };
}

function getPositionBenchmark(pos) {
  const map = {
    DC: [70, 69, 57, 64, 36, 61],
    ED: [74, 66, 61, 72, 34, 58],
    MC: [68, 61, 71, 66, 63, 67],
    DFC: [58, 44, 61, 52, 73, 76],
    PO: [44, 33, 56, 42, 66, 59]
  };
  return map[pos] || [65, 58, 60, 61, 50, 55];
}

function formatMonthDay(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return 'Agosto 24';
  const month = date.toLocaleDateString('es-CL', { month: 'long' });
  return `${toTitleCase(month)} ${String(date.getDate()).padStart(2, '0')}`;
}

function updatePlayerUI() {
  try {
    const p = appState.profile;
    if (!p || !p.Bio) return;

    const theme = THEME_PALETTES[p.Theme] || THEME_PALETTES.rmadrid;
    document.documentElement.style.setProperty('--team-primary', theme.primary);
    document.documentElement.style.setProperty('--team-glow', theme.bgTint);

    const ovr = Number(p.Ovr || 50);
    const fatigue = Number.isFinite(p.Fatigue) ? p.Fatigue : 82;

    setElementText('topnav-player-name', String(p.Bio.Nombre || '').toUpperCase());
    setElementText('pldash-name', String(p.Bio.Nombre || '').toUpperCase().replace(' ', '<br>'));
    setElementText('pldash-role', getTopRoleLabel(p.Bio.Pos));
    setElementText('pldash-ovr', ovr);
    setElementText('pldash-status', toTitleCase(p.Status || 'Jugador libre'));
    setElementText('pldash-academy', p.AcademyName || 'FUTLAB SANTIAGO');

    const year = getBirthYear(p.Bio.Birthdate);
    const age = p.Bio.Edad || Math.max(14, new Date().getFullYear() - Number(year));
    setElementText('pldash-birth-year', year);
    setElementText('pldash-age', `${age} años`);
    setElementText('pldash-foot', toTitleCase(p.Bio.Foot || 'Derecho'));

    const percentile = Math.min(99, Math.max(68, ovr + 4));
    const readiness = Math.min(99, Math.max(45, fatigue));
    const evolution = Math.max(1, Math.round((ovr - 80) / 2));

    setElementText('pldash-percentil', `${percentile}%`);
    setElementText('pldash-readiness', `${readiness}%`);
    setElementText('pldash-evolution', `+${evolution}`);

    const levels = getPerformanceLevel(ovr);
    setElementText('pldash-level-current', levels.current.name);
    setElementText('pldash-level-next', levels.next.name);
    setElementText('pldash-progress-label', `${levels.progress}%`);
    const progressFill = document.getElementById('pldash-progress-fill');
    if (progressFill) progressFill.style.width = `${levels.progress}%`;

    const dbStr = localStorage.getItem('FutLab_DB_V1');
    if (dbStr) {
      const db = JSON.parse(dbStr);
      const latest = Array.isArray(db.history) && db.history.length > 0 ? db.history[db.history.length - 1] : null;
      if (latest && latest.date) {
        setElementText('pldash-last-test', formatMonthDay(latest.date));
        const next = new Date(latest.date);
        next.setDate(next.getDate() + 14);
        setElementText('pldash-next-test', `Próximo: ${formatMonthDay(next.toISOString())}`);
      }
    }

    const heightM = Math.max(1.4, Number((Number(p.Bio.Estatura || 175) / 100).toFixed(2)) || 1.75);
    const weight = Number(p.Bio.Peso || 72);
    const imc = Number((weight / (heightM * heightM)).toFixed(1));
    const restingHr = Math.max(48, Math.min(72, 50 + Math.round((100 - fatigue) / 3)));
    const sleepHours = 6 + (ovr % 3);
    const sleepMinutes = (ovr * 5) % 60;
    const sleepEfficiency = Math.max(80, Math.min(98, 86 + Math.round(fatigue / 7)));
    const stressMs = Math.max(35, Math.min(90, 95 - fatigue));

    setElementText('pldash-imc', imc.toFixed(1));
    setElementText('pldash-resting-hr', restingHr);
    setElementText('pldash-sleep', `${sleepHours}h ${String(sleepMinutes).padStart(2, '0')}m`);
    setElementText('pldash-sleep-eff', `${sleepEfficiency}% Eficiencia`);
    setElementText('pldash-stress-ms', `${stressMs} ms`);

    const fatigueStatus = fatigue >= 88 ? 'Baja' : fatigue >= 74 ? 'Moderada' : 'Alta';
    const fatiguePct = Math.max(5, 100 - fatigue);
    setElementText('pldash-fatigue-status', fatigueStatus);
    setElementText('pldash-fatigue-value', `${fatiguePct}% / 100%`);
    setElementText('pldash-stress', stressMs <= 55 ? 'Bajo' : stressMs <= 70 ? 'Moderado' : 'Elevado');

    renderPlayerDevices(p.Wearables);
    renderKeyAttributes(p.Stats || {}, ovr);

    requestAnimationFrame(() => {
      renderRadar(p.Stats || {}, theme.primary, p.Bio.Pos);
      if (radarChart) radarChart.resize();
    });

    renderAvatar();
    syncPlayerTopTabs('pl-profile');
    initIcons();
  } catch (error) {
    console.error('Error en Update UI:', error);
  }
}

function renderPlayerDevices(wearables) {
  const container = document.getElementById('pldash-devices');
  if (!container) return;

  const items = [
    { icon: 'watch', label: 'Reloj inteligente', value: wearables?.appleWatch || '92%' },
    { icon: 'circle', label: 'Anillo', value: wearables?.oura || 'ON' },
    { icon: 'shield', label: 'Peto GPS', value: wearables?.peto || 'ON' }
  ];

  container.innerHTML = items
    .map(
      (item) =>
        `<span class="pldash-device-tag"><i data-lucide="${item.icon}" style="width:11px;"></i>${item.label}</span>`
    )
    .join('');
}

function renderKeyAttributes(stats, ovr) {
  const container = document.getElementById('pldash-key-attrs');
  if (!container) return;

  const entries = [
    ['Ritmo', stats.Ritmo || Math.max(40, ovr - 18)],
    ['Tiro', stats.Tiro || Math.max(40, ovr - 24)],
    ['Pases', stats.Pases || Math.max(40, ovr - 30)],
    ['Regate', stats.Regate || Math.max(40, ovr - 21)],
    ['Físico', stats['Físico'] || stats.Fisico || Math.max(40, ovr - 26)],
    ['Defensa', stats.Defensa || Math.max(25, ovr - 50)]
  ];

  const minValue = Math.min(...entries.map((entry) => entry[1]));

  container.innerHTML = entries
    .map(([label, value]) => {
      const width = Math.max(8, Math.min(100, Number(value)));
      const lowClass = value === minValue ? 'is-low' : '';
      return `
        <div class="pldash-attr-row ${lowClass}">
          <div class="pldash-attr-head">
            <span>${label}</span>
            <strong>${Math.round(value)}</strong>
          </div>
          <div class="pldash-attr-track"><div style="width:${width}%"></div></div>
        </div>
      `;
    })
    .join('');
}

function renderRadar(stats, colorHex, position) {
  const canvas = document.getElementById('chart-radar');
  if (!canvas || typeof Chart === 'undefined') return;

  const accent = colorHex || '#c9a227';
  const order = ['Ritmo', 'Tiro', 'Pases', 'Regate', 'Defensa', 'Físico'];
  const playerValues = order.map((label) => {
    if (label === 'Físico') return stats['Físico'] || stats.Fisico || 0;
    return stats[label] || 0;
  });
  const benchmark = getPositionBenchmark(position);

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: order.map((label) => label.toUpperCase()),
      datasets: [
        {
          label: 'Jugador actual',
          data: playerValues,
          backgroundColor: `${accent}55`,
          borderColor: accent,
          borderWidth: 2.5,
          pointBackgroundColor: accent,
          pointRadius: 2,
          fill: true
        },
        {
          label: 'Media posición',
          data: benchmark,
          borderColor: 'rgba(203, 213, 225, 0.45)',
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false, stepSize: 20 },
          grid: { color: 'rgba(255,255,255,0.13)' },
          angleLines: { color: 'rgba(255,255,255,0.12)' },
          pointLabels: {
            color: '#e2e8f0',
            font: { size: 11, weight: '700', family: 'Satoshi' }
          }
        }
      }
    }
  });
}

function clipStat(value, min = 20, max = 99) {
  return Math.max(min, Math.min(max, Number(value) || min));
}

function averageEqual(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((acc, current) => acc + Number(current || 0), 0);
  return Math.round(sum / values.length);
}

function getSubValue(subattrs, key, fallback) {
  if (subattrs && Number.isFinite(Number(subattrs[key]))) return Number(subattrs[key]);
  return Number(fallback);
}

function buildEvolutionModel(profile) {
  const stats = profile?.Stats || {};
  const subattrs = profile?.Subattrs || {};
  const fatigue = Number.isFinite(Number(profile?.Fatigue)) ? Number(profile.Fatigue) : 82;
  const currentOvrInput = clipStat(profile?.Ovr || 78, 45, 99);

  const componentMap = {
    Ritmo: [
      ['Aceleración', clipStat(getSubValue(subattrs, 'ace', (stats.Ritmo || currentOvrInput) + 2))],
      ['Vel. Sprint', clipStat(getSubValue(subattrs, 'spr', (stats.Ritmo || currentOvrInput) - 1))]
    ],
    Tiro: [
      ['Ataque', clipStat(getSubValue(subattrs, 'fin', stats.Tiro || currentOvrInput - 4))],
      ['Definición', clipStat(getSubValue(subattrs, 'fin', stats.Tiro || currentOvrInput - 4))],
      ['Potencia', clipStat(getSubValue(subattrs, 'pot', (stats.Tiro || currentOvrInput - 4) + 1))],
      ['Tiros lejanos', clipStat((stats.Tiro || currentOvrInput - 4) - 2)]
    ],
    Pase: [
      ['Visión', clipStat(getSubValue(subattrs, 'vis', stats.Pases || currentOvrInput - 6))],
      ['Pase corto', clipStat(getSubValue(subattrs, 'pas', stats.Pases || currentOvrInput - 6))],
      ['Efecto', clipStat((stats.Pases || currentOvrInput - 6) - 2)]
    ],
    Regate: [
      ['Agilidad', clipStat((stats.Regate || currentOvrInput - 3) - 3)],
      ['Equilibrio', clipStat((stats.Regate || currentOvrInput - 3) - 4)],
      ['Reacciones', clipStat((stats.Regate || currentOvrInput - 3) + 1)],
      ['Control balón', clipStat(getSubValue(subattrs, 'con', stats.Regate || currentOvrInput - 3))],
      ['Regates', clipStat(getSubValue(subattrs, 'reg', (stats.Regate || currentOvrInput - 3) + 2))],
      ['Compostura', clipStat((stats.Regate || currentOvrInput - 3) + 3)]
    ],
    Físico: [
      ['Resistencia', clipStat(getSubValue(subattrs, 'res', stats['Físico'] || stats.Fisico || currentOvrInput - 2))],
      ['Fuerza', clipStat(getSubValue(subattrs, 'fue', stats['Físico'] || stats.Fisico || currentOvrInput - 2))]
    ],
    Defensa: [
      ['Intercep.', clipStat(getSubValue(subattrs, 'int', stats.Defensa || currentOvrInput - 30))],
      ['Cabeza', clipStat((stats.Defensa || currentOvrInput - 30) + 14)]
    ]
  };

  const mainAttrs = {};
  Object.entries(componentMap).forEach(([attr, components]) => {
    mainAttrs[attr] = averageEqual(components.map((entry) => entry[1]));
  });

  const overallNow = clipStat(averageEqual(Object.values(mainAttrs)), 45, 99);
  const baselineOverall = clipStat(overallNow - Math.max(12, Math.min(26, Math.round(overallNow * 0.28))), 45, 96);
  const totalGain = Math.max(2, overallNow - baselineOverall);

  const months = ['FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO'];
  const growthCurve = [0, 0.18, 0.37, 0.57, 0.69, 0.79, 1];
  const series = months.map((_, idx) => clipStat(Math.round(baselineOverall + totalGain * growthCurve[idx]), 40, 99));
  series[series.length - 1] = overallNow;

  const initialDrop = {
    Ritmo: 0.35,
    Tiro: 0.42,
    Pase: 0.4,
    Regate: 0.36,
    Defensa: 0.52,
    Físico: 0.44
  };

  const startAttrs = {};
  Object.entries(mainAttrs).forEach(([key, value]) => {
    const decrement = Math.max(2, Math.round(totalGain * (initialDrop[key] || 0.4)));
    startAttrs[key] = clipStat(value - decrement, 20, 98);
  });

  const sorted = Object.entries(mainAttrs).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const second = sorted[1];

  return {
    componentMap,
    mainAttrs,
    startAttrs,
    overallNow,
    baselineOverall,
    totalGain,
    months,
    series,
    projection: clipStat(overallNow + Math.max(1, Math.round(totalGain * 0.1)), 50, 99),
    streak: Math.max(2, Math.min(9, Math.round(totalGain / 4) + 2)),
    readiness: Math.max(55, Math.min(98, fatigue)),
    bestAttrName: best ? best[0] : 'Ritmo',
    bestAttrValue: best ? best[1] : 0,
    secondAttrName: second ? second[0] : 'Regate',
    secondAttrValue: second ? second[1] : 0
  };
}

function renderEvolutionCompareBars(model) {
  const container = document.getElementById('plevo-compare-bars');
  if (!container) return;

  const order = ['Ritmo', 'Tiro', 'Pase', 'Regate', 'Defensa', 'Físico'];
  container.innerHTML = order
    .map((attr) => {
      const startVal = model.startAttrs[attr];
      const currentVal = model.mainAttrs[attr];
      return `
        <div class="plevo-compare-row">
          <div class="plevo-compare-head">
            <span>${attr}</span>
            <strong>${currentVal}</strong>
          </div>
          <div class="plevo-compare-track">
            <div class="plevo-compare-start" style="width:${startVal}%"></div>
            <div class="plevo-compare-now" style="width:${currentVal}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderEvolutionBreakdown(model) {
  const left = document.getElementById('plevo-breakdown-left');
  const right = document.getElementById('plevo-breakdown-right');
  if (!left || !right) return;

  const leftGroups = ['Regate', 'Tiro', 'Pase'];
  const rightGroups = ['Ritmo', 'Físico', 'Defensa'];

  const renderGroups = (groups) =>
    groups
      .map((groupName) => {
        const rows = model.componentMap[groupName] || [];
        return `
          <div class="plevo-break-group">
            <h5>${groupName.toUpperCase()}</h5>
            ${rows
              .map(
                (row) =>
                  `<div class="plevo-break-row"><span>${row[0]}</span><strong>${row[1]}</strong></div>`
              )
              .join('')}
          </div>
        `;
      })
      .join('');

  left.innerHTML = renderGroups(leftGroups);
  right.innerHTML = renderGroups(rightGroups);

  const analysis = document.getElementById('plevo-analysis');
  if (analysis) {
    analysis.innerHTML = `<strong>Análisis FutLab:</strong> Rendimiento destacado en ${model.bestAttrName} (${model.bestAttrValue}) y ${model.secondAttrName} (${model.secondAttrValue}). La media ponderada de componentes mantiene consistencia técnica durante el ciclo.`;
  }
}

function renderEvolutionConsistency(model) {
  const container = document.getElementById('plevo-consistency');
  if (!container) return;

  const cells = new Array(28).fill(0).map((_, idx) => {
    const base = (idx * 17 + model.totalGain * 3) % 100;
    if (base > 75) return 4;
    if (base > 60) return 3;
    if (base > 45) return 2;
    if (base > 30) return 1;
    return 0;
  });

  container.innerHTML = cells
    .map((level) => `<span class="plevo-consistency-cell level-${level}"></span>`)
    .join('');
}

function renderEvolutionTimeline(model) {
  const container = document.getElementById('plevo-timeline');
  if (!container) return;

  const points = [
    { value: model.baselineOverall, date: 'Feb 2025', text: 'Evaluación Inicial' },
    { value: model.series[1], date: 'Mar 2025', text: 'Ingreso Academia' },
    { value: model.mainAttrs[model.bestAttrName], date: 'May 2025', text: `Salto ${model.bestAttrName}` },
    { value: model.series[4], date: 'Jun 2025', text: 'Consolidación Técnica' },
    { value: model.secondAttrValue, date: 'Ago 2025', text: 'Rendimiento Peak' },
    { value: model.overallNow, date: 'Hoy', text: 'Estado Actual' }
  ];

  container.innerHTML = points
    .map(
      (point, idx) => `
        <div class="plevo-time-item ${idx === points.length - 1 ? 'is-final' : ''}">
          <div class="plevo-time-badge">${point.value}</div>
          <strong>${point.date}</strong>
          <span>${point.text}</span>
        </div>
      `
    )
    .join('');
}

function renderPlayerOverall() {
  const canvas = document.getElementById('chart-player-overall');
  if (!canvas || typeof Chart === 'undefined' || !appState.profile) return;

  const model = buildEvolutionModel(appState.profile);
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--team-primary').trim() || '#c9a227';

  setElementText('plevo-overall-now', model.overallNow);
  setElementText('plevo-overall-gain', `vs ${model.baselineOverall} (+${model.totalGain})`);
  setElementText('plevo-streak', model.streak);
  setElementText('plevo-best-attr', `${model.bestAttrName} ${model.bestAttrValue}`);
  setElementText('plevo-total-pill', `+${model.totalGain} total`);
  setElementText('plevo-summary-total', `+${model.totalGain}`);

  const dbStr = localStorage.getItem('FutLab_DB_V1');
  let sessions = 24;
  let tests = 3;
  let matches = 12;
  let nextTestText = 'Sep 12';

  if (dbStr) {
    const db = JSON.parse(dbStr);
    if (Array.isArray(db.history) && db.history.length > 0) {
      sessions = Math.max(12, Math.min(32, db.history.length));
      tests = Math.max(2, Math.round(sessions / 8));
      matches = Math.max(8, Math.round(sessions / 2));
      const lastDate = new Date(db.history[db.history.length - 1].date);
      if (!Number.isNaN(lastDate.getTime())) {
        lastDate.setDate(lastDate.getDate() + 14);
        nextTestText = lastDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      }
    }
  }

  setElementText('plevo-next-test', nextTestText);
  setElementText('plevo-summary-matches', matches);
  setElementText('plevo-summary-tests', tests);
  setElementText('plevo-summary-sessions', sessions);

  const goalProgress = Math.min(100, Math.max(12, Math.round((model.overallNow / 90) * 100)));
  setElementText('plevo-goal-progress', `${goalProgress}%`);
  setElementText(
    'plevo-goal-text',
    `Has superado la meta inicial. Con un OVR de ${model.overallNow} y atributos de ${model.bestAttrName.toLowerCase()} (${model.bestAttrValue}) y ${model.secondAttrName.toLowerCase()} (${model.secondAttrValue}), mantienes un perfil competitivo sostenido.`
  );

  const goalTitle = goalProgress >= 95 ? 'Élite Profesional' : goalProgress >= 80 ? 'Competitivo Alto' : 'En Consolidación';
  setElementText('plevo-goal-title', goalTitle);

  renderEvolutionConsistency(model);
  renderEvolutionCompareBars(model);
  renderEvolutionBreakdown(model);
  renderEvolutionTimeline(model);

  const labels = [...model.months, 'PROY'];
  const actualSeries = [...model.series, null];
  const projectionSeries = new Array(model.months.length - 1).fill(null).concat([model.series[model.series.length - 1], model.projection]);

  if (playerProgressChart) playerProgressChart.destroy();
  playerProgressChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: actualSeries,
          borderColor: primary,
          backgroundColor: `${primary}2a`,
          borderWidth: 4,
          fill: true,
          tension: 0.34,
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: primary
        },
        {
          data: projectionSeries,
          borderColor: `${primary}99`,
          borderWidth: 2,
          borderDash: [6, 6],
          fill: false,
          tension: 0.34,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: false,
          min: Math.max(45, model.baselineOverall - 4),
          max: 100,
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { color: '#94a3b8', stepSize: 5 }
        },
        x: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#cbd5e1', font: { size: 11, weight: '700' } }
        }
      }
    }
  });
}

function syncPlayerTopTabs(activePageId) {
  const tabs = document.querySelectorAll('#topnav-player .pl-tab[data-page]');
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.page === activePageId);
  });
}

function openPlayerTab(tabEl) {
  if (!tabEl) return;
  const pageId = tabEl.dataset.page;
  if (!pageId) return;

  const navMap = {
    'pl-profile': 'nav-pl-profile',
    'pl-evolution': 'nav-pl-evolution',
    'pl-training': 'nav-pl-training'
  };

  const navEl = navMap[pageId] ? document.getElementById(navMap[pageId]) : null;
  showPage(pageId, navEl || null);
  syncPlayerTopTabs(pageId);
}

function updateRoutine() {
  const target = document.getElementById('target-stat');
  const container = document.getElementById('routine-content');
  if (!target || !container) return;

  const routines = {
    ritmo: [
      'Bloque 1: aceleraciones de 10m y 20m (6 repeticiones).',
      'Bloque 2: cambios de dirección 45°/90° con balón (4 series).',
      'Bloque 3: sprint final + definición en movimiento.'
    ],
    fisico: [
      'Bloque 1: fuerza de tren inferior (sentadilla búlgara + zancadas).',
      'Bloque 2: core anti-rotación y estabilidad pélvica.',
      'Bloque 3: trabajo de resistencia específica con intervalos.'
    ]
  };

  const selected = routines[target.value] || routines.ritmo;
  container.innerHTML = `<ul style="margin:0; padding-left: 18px; display:grid; gap:10px;">${selected
    .map((item) => `<li>${item}</li>`)
    .join('')}</ul>`;
}

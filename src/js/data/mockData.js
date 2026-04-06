// mockData.js — FutLab Sim Engine v2

const SISTEMA_DB_KEY = 'FutLab_DB_V1';
const DB_VERSION = 3; // bump to force re-init when schema changes

// Auto-clear old schema on page load
(function checkDBVersion() {
  try {
    const raw = localStorage.getItem(SISTEMA_DB_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      // Actual check for DB_VERSION
      if (!db.v || db.v < DB_VERSION) {
        localStorage.removeItem(SISTEMA_DB_KEY);
        console.log(`🔄 DB version ${db.v || 0} → ${DB_VERSION}. Reiniciando datos demo...`);
      }
    }
  } catch(e) { localStorage.removeItem(SISTEMA_DB_KEY); }
})();


const CHILEAN_NAMES = [
  "Matías González", "Benjamín Silva", "Tomás Soto", "Agustín Contreras", "Vicente Martínez", 
  "Martín Sepúlveda", "Joaquín Morales", "Maximiliano López", "Cristóbal Fuentes", "Lucas Rojas",
  "Diego Valdés", "Simón Castillo", "Ignacio Herrera", "Felipe Tapia", "Javier Castro",
  "Bastián Fernández", "Cristián Ramírez", "Nicolás Pérez", "Pedro Muñoz", "Juan Pablo Ruiz",
  "Renato Díaz", "Clemente Vargas", "Alonso Reyes", "Emilio Álvarez", "Rodrigo Gómez",
  "Mateo Gutiérrez", "Julián Araya", "Santino Pizarro", "Gabriel Ríos", "Leonel Espinoza"
];

// --- MOTOR DE ATRIBUTOS (Realistic Stats Engine) ---
const FootballStatsEngine = {
  SEGMENT_PROFILES: {
    'amateur': { minOvr: 42, maxOvr: 60, attrMin: 28, attrMax: 72 },
    'competitivo': { minOvr: 61, maxOvr: 78, attrMin: 50, attrMax: 85 },
    'elite': { minOvr: 79, maxOvr: 95, attrMin: 70, attrMax: 99 }
  },

  POSITION_PROFILES: {
    'DC':  { Ritmo: [48,60], Tiro: [46,58], Pases: [34,46], Regate: [40,54], Defensa: [28,38], Físico: [42,56] },
    'ED':  { Ritmo: [50,62], Tiro: [40,52], Pases: [38,50], Regate: [46,58], Defensa: [28,36], Físico: [38,50] },
    'EI':  { Ritmo: [50,62], Tiro: [40,52], Pases: [38,50], Regate: [46,58], Defensa: [28,36], Físico: [38,50] },
    'MO':  { Ritmo: [42,54], Tiro: [38,50], Pases: [46,58], Regate: [44,56], Defensa: [30,40], Físico: [38,50] },
    'MC':  { Ritmo: [40,52], Tiro: [34,46], Pases: [44,56], Regate: [38,50], Defensa: [36,48], Físico: [42,54] },
    'MCD': { Ritmo: [36,48], Tiro: [30,40], Pases: [40,52], Regate: [34,46], Defensa: [44,56], Físico: [46,58] },
    'LD':  { Ritmo: [46,58], Tiro: [30,42], Pases: [38,50], Regate: [34,48], Defensa: [42,54], Físico: [44,58] },
    'LI':  { Ritmo: [46,58], Tiro: [30,42], Pases: [38,50], Regate: [34,48], Defensa: [42,54], Físico: [44,58] },
    'DFC': { Ritmo: [32,44], Tiro: [28,36], Pases: [34,46], Regate: [28,38], Defensa: [48,60], Físico: [50,62] }
  },

  OVR_WEIGHTS: {
    'DC':  { Ritmo: 0.22, Tiro: 0.26, Pases: 0.12, Regate: 0.22, Defensa: 0.06, Físico: 0.12 },
    'ED':  { Ritmo: 0.24, Tiro: 0.18, Pases: 0.16, Regate: 0.24, Defensa: 0.04, Físico: 0.14 },
    'EI':  { Ritmo: 0.24, Tiro: 0.18, Pases: 0.16, Regate: 0.24, Defensa: 0.04, Físico: 0.14 },
    'MO':  { Ritmo: 0.14, Tiro: 0.16, Pases: 0.24, Regate: 0.22, Defensa: 0.08, Físico: 0.16 },
    'MC':  { Ritmo: 0.14, Tiro: 0.12, Pases: 0.24, Regate: 0.18, Defensa: 0.14, Físico: 0.18 },
    'MCD': { Ritmo: 0.12, Tiro: 0.08, Pases: 0.20, Regate: 0.14, Defensa: 0.22, Físico: 0.24 },
    'LD':  { Ritmo: 0.20, Tiro: 0.08, Pases: 0.16, Regate: 0.12, Defensa: 0.20, Físico: 0.24 },
    'LI':  { Ritmo: 0.20, Tiro: 0.08, Pases: 0.16, Regate: 0.12, Defensa: 0.20, Físico: 0.24 },
    'DFC': { Ritmo: 0.10, Tiro: 0.04, Pases: 0.14, Regate: 0.08, Defensa: 0.32, Físico: 0.32 }
  },

  generateRandomIn(range) {
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  },

  initNewPlayer(posId, segment = 'amateur') {
    const profile = this.POSITION_PROFILES[posId] || this.POSITION_PROFILES['MC'];
    const seg = this.SEGMENT_PROFILES[segment] || this.SEGMENT_PROFILES['amateur'];
    
    // 1. Generate Subattributes (with random drift)
    const drift = () => Math.floor(Math.random() * 7) - 3; // -3 to +3
    
    const subattrs = {
      ace: this.generateRandomIn(profile.Ritmo) + drift(),
      spr: this.generateRandomIn(profile.Ritmo) + drift(),
      fin: this.generateRandomIn(profile.Tiro) + drift(),
      pot: this.generateRandomIn(profile.Tiro) + drift(),
      vis: this.generateRandomIn(profile.Pases) + drift(),
      pas: this.generateRandomIn(profile.Pases) + drift(),
      con: this.generateRandomIn(profile.Regate) + drift(),
      reg: this.generateRandomIn(profile.Regate) + drift(),
      int: this.generateRandomIn(profile.Defensa) + drift(),
      ent: this.generateRandomIn(profile.Defensa) + drift(),
      res: this.generateRandomIn(profile.Físico) + drift(),
      fue: this.generateRandomIn(profile.Físico) + drift()
    };

    // Keep within segment bounds
    Object.keys(subattrs).forEach(k => {
      subattrs[k] = Math.max(seg.attrMin, Math.min(seg.attrMax, subattrs[k]));
    });

    // 2. Aggregate main attributes
    const stats = {
      'Ritmo': Math.round(subattrs.ace * 0.5 + subattrs.spr * 0.5),
      'Tiro': Math.round(subattrs.fin * 0.65 + subattrs.pot * 0.35),
      'Pases': Math.round(subattrs.vis * 0.45 + subattrs.pas * 0.55),
      'Regate': Math.round(subattrs.con * 0.5 + subattrs.reg * 0.5),
      'Defensa': Math.round(subattrs.int * 0.55 + subattrs.ent * 0.45),
      'Físico': Math.round(subattrs.res * 0.45 + subattrs.fue * 0.55)
    };

    // 3. Consistency Validation
    if (posId === 'DFC') {
      stats['Defensa'] = Math.max(stats['Defensa'], stats['Tiro'] + 10);
      stats['Físico'] = Math.max(stats['Físico'], stats['Tiro'] + 10);
    }
    if (['DC', 'ED', 'EI'].includes(posId)) {
      const top = Math.max(stats['Ritmo'], stats['Tiro']);
      if (stats['Ritmo'] < top && stats['Tiro'] < top) stats['Ritmo'] = top;
    }
    if (posId === 'MC') {
      stats['Pases'] = Math.max(stats['Pases'], stats['Ritmo']);
    }

    // 4. Calculate OVR
    const weights = this.OVR_WEIGHTS[posId] || this.OVR_WEIGHTS['MC'];
    let ovrBase = 0;
    Object.keys(stats).forEach(k => {
      ovrBase += stats[k] * weights[k];
    });
    const ovr = Math.round(ovrBase);

    return { stats, ovr, subattrs };
  },

  getLevelLabel(ovr) {
    if (ovr >= 79) return "ALTO RENDIMIENTO";
    if (ovr >= 70) return "FORMATIVO ALTO";
    if (ovr >= 61) return "COMPETITIVO";
    if (ovr >= 57) return "AMATEUR FUERTE";
    if (ovr >= 50) return "AMATEUR MEDIO";
    return "AMATEUR INICIAL";
  }
};

const POSITIONS = ["DC", "MC", "LD", "DFC", "PO", "ED", "MO", "LI"];
const FEET = ["DERECHO", "DERECHO", "DERECHO", "ZURDO"];

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRandomName() { return CHILEAN_NAMES[getRandomInt(0, CHILEAN_NAMES.length - 1)]; }
function randomFoot() { return FEET[getRandomInt(0, FEET.length - 1)]; }
function randomBirthdate(ageMin, ageMax) {
  const age = getRandomInt(ageMin, ageMax);
  const year = new Date().getFullYear() - age;
  const month = String(getRandomInt(1, 12)).padStart(2, '0');
  const day   = String(getRandomInt(1, 28)).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

function generatePlayer(segment = 'amateur', ageMin = 14, ageMax = 30) {
  const posId = POSITIONS[getRandomInt(0, POSITIONS.length - 1)];
  const { stats, ovr, subattrs } = FootballStatsEngine.initNewPlayer(posId, segment);

  return {
    id: 'P_' + Math.random().toString(36).substr(2, 9),
    name: getRandomName(),
    age: getRandomInt(ageMin, ageMax),
    height: getRandomInt(160, 185) / 100,
    weight: getRandomInt(55, 85),
    position: posId,
    foot: randomFoot(),
    birthdate: randomBirthdate(ageMin, ageMax),
    stats: stats,
    subattrs: subattrs,
    ovr: ovr,
    status: FootballStatsEngine.getLevelLabel(ovr),
    wearables: { oura: 'ON', appleWatch: getRandomInt(80, 100) + '%', peto: 'ON' },
    fatigue: getRandomInt(80, 98),
    payment: {
      plan: ["Mensual", "Semestral", "Anual"][getRandomInt(0,2)],
      status: Math.random() > 0.1 ? "Al Día" : "Atrasado"
    }
  };
}

function generateHistory(startDate) {
  let classes = [];
  let current = new Date(startDate);
  for(let i=0; i<8; i++) {
    classes.push({
      date: current.toISOString().split('T')[0],
      duration: '60 min',
      focus: 'Mix Físico/Táctico (F7)',
      matchMins: 20,
      trainingMins: 40
    });
    current.setDate(current.getDate() + (i % 2 === 0 ? 3 : 4));
  }
  return classes;
}

function initMockDB() {
  if (localStorage.getItem(SISTEMA_DB_KEY)) return; // already initialized

  let db = {
    v: DB_VERSION,
    users: [
      { email: 'dt@futlab.cl',        pass: 'Chile2026', role: 'manager', profileId: 'M1' },
      { email: 'jugador1@futlab.cl',  pass: 'Chile2026', role: 'player',  profileId: 'J1_SUB30' },
      { email: 'jugador2@futlab.cl',  pass: 'Chile2026', role: 'player',  profileId: 'J2_SUB14' }
    ],
    academies: [],
    history: generateHistory('2026-03-01T00:00:00Z')
  };

  db.academies = [];

  const regiones = [
    { id: 'R1', name: 'LAS CONDES', count: 28 },
    { id: 'R2', name: 'ÑUÑOA', count: 22 },
    { id: 'R3', name: 'PROVIDENCIA', count: 31 },
    { id: 'R4', name: 'VITACURA', count: 19 }
  ];

  regiones.forEach(reg => {
    let aca = { id: reg.id, name: reg.name, startDate: '2026-03-01', players: [] };
    for(let i=0; i < reg.count; i++) {
        let segment = i < 3 ? 'elite' : i < 10 ? 'competitivo' : 'amateur';
        aca.players.push(generatePlayer(segment, 14, 30));
    }
    db.academies.push(aca);
  });

  // Override primer jugador de Las Condes (demo login)
  const nicoBase = FootballStatsEngine.initNewPlayer('DC', 'elite');
  Object.assign(db.academies[0].players[0], {
    id: 'J1_SUB30',
    name: 'MATEO VALDÉS',
    stats: nicoBase.stats,
    subattrs: nicoBase.subattrs,
    ovr: 88,
    status: 'ÉLITE',
    position: 'DC', 
    foot: 'DERECHO', 
    birthdate: '2004-04-12', 
    age: 21, 
    weight: 74, 
    height: 1.80, 
    fatigue: 94
  });

  // Override otros jugadores notables del diseño
  Object.assign(db.academies[1].players[0], { name: 'JOAQUÍN SOTO', position: 'PO', ovr: 82 });
  Object.assign(db.academies[2].players[0], { name: 'NICOLÁS RIVAS', position: 'DFC', ovr: 86 });
  Object.assign(db.academies[3].players[0], { name: 'BENJAMÍN DÍAZ', position: 'MC', ovr: 83 });
  Object.assign(db.academies[0].players[1], { name: 'LUCAS PEÑA', position: 'MC', ovr: 84 });

  localStorage.setItem(SISTEMA_DB_KEY, JSON.stringify(db));
  console.log('✅ FutLab Mock DB inicializada.');
}

initMockDB();

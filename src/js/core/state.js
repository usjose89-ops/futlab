console.log("FutLab Script V3 Loaded");
// Shared state and core helpers
// --- PALETAS DE COLORES ---
const THEME_PALETTES = {
  'gold':   { primary: '#c9a227', bgTint: 'rgba(201, 162, 39, 0.18)', emoji: '⚽' }, // DORADO PREMIUM (default)
  'futlab': { primary: '#38bdf8', bgTint: 'rgba(56, 189, 248, 0.15)', emoji: '⚽' },
  'colo':   { primary: '#ffffff', bgTint: 'rgba(255, 255, 255, 0.05)', emoji: '🏴' },
  'udi':    { primary: '#2563eb', bgTint: 'rgba(37, 99, 235, 0.15)',  emoji: '🦉' },
  'uc':     { primary: '#0ea5e9', bgTint: 'rgba(14, 165, 233, 0.1)',  emoji: '🛡️' },
  'rmadrid':{ primary: '#c9a227', bgTint: 'rgba(201, 162, 39, 0.15)', emoji: '👑' },
  'barca':  { primary: '#dc2626', bgTint: 'rgba(220, 38, 38, 0.1)',   emoji: '🔴' },
  'lfc':    { primary: '#e11d48', bgTint: 'rgba(225, 29, 72, 0.2)',   emoji: '🦥' },
  'city':   { primary: '#38bdf8', bgTint: 'rgba(56, 189, 248, 0.1)',  emoji: '🩵' },
  'manu':   { primary: '#dc2626', bgTint: 'rgba(220, 38, 38, 0.1)',   emoji: '😈' }
};

// --- ESTADO GLOBAL ---
const STORAGE_KEY = 'FutLab_Modular_V6';
let appState = { profile: null };
window.getAppState = () => appState; // Global access for debugging
let obAnswers = { q1: '', q2: '', q3: '' };
let radarChart = null, dtLineChart = null, playerProgressChart = null, playerLinesChart = null;

// --- MOTOR DE ATRIBUTOS (Deduplicated, now in mockData.js) ---

// Funciones Auxiliares Seguras
function setElementText(id, text) { const el = document.getElementById(id); if(el) el.innerHTML = text; }
function initIcons() { 
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  } else if (window.lucide) {
    window.lucide.createIcons();
  }
}

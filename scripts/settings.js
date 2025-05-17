// settings.js

(async function(){
  const SETTINGS_KEY = 'gameSettings';
  const LOG_KEY      = 'gameLog';
  const STATS_KEY    = 'gameStats';
  const STATS_JSON   = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/stats.json';

  let DEFAULT_STATS = null;

  // Fetch JSON with cache‐bust
  async function fetchJSON(url) {
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
  }

  // Load default stats schema once
  async function loadDefaults() {
    if (DEFAULT_STATS) return;
    const { defaultStats } = await fetchJSON(STATS_JSON);
    DEFAULT_STATS = defaultStats;
  }

  // Initialize stats in localStorage if missing
  async function ensureStats() {
    await loadDefaults();
    if (!localStorage.getItem(STATS_KEY)) {
      localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
    }
  }

  // Log helper
  function logAction(msg) {
    const raw = localStorage.getItem(LOG_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({ time: new Date().toISOString(), message: msg });
    if (log.length > 200) log.pop();
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    renderLog();
  }

  // Settings helpers
  const defaultSettings = { notifications: true, autoSave: true };
  function loadSettings() {
    try {
      return Object.assign({}, defaultSettings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {});
    } catch {
      return { ...defaultSettings };
    }
  }
  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  // Render toggles
  function renderSettings(s) {
    document.getElementById('toggle-notif').checked    = s.notifications;
    document.getElementById('toggle-autosave').checked = s.autoSave;
  }

  // Render activity log
  function renderLog() {
    const container = document.getElementById('log-list');
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) {
      container.innerHTML = '<div style="text-align:center;color:#ccc;padding:12px;">No log yet.</div>';
      return;
    }
    const log = JSON.parse(raw);
    if (!log.length) {
      container.innerHTML = '<div style="text-align:center;color:#ccc;padding:12px;">No entries.</div>';
      return;
    }
    container.innerHTML = log.map(e => {
      const t = new Date(e.time).toLocaleString();
      return `<div style="margin-bottom:6px;text-align:left;"><span style="color:#999;margin-right:6px;">${t}</span>${e.message}</div>`;
    }).join('');
  }

  // Clear log
  function clearLog() {
    localStorage.removeItem(LOG_KEY);
    renderLog();
    logAction('Log cleared');
  }

  // Export log
  function exportLog() {
    const raw = localStorage.getItem(LOG_KEY) || '[]';
    const blob = new Blob([raw], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'game-log.json'; a.click();
    URL.revokeObjectURL(url);
    logAction('Log exported');
  }

  // Reset game
  function resetGame() {
    if (!confirm('Reset entire game? This cannot be undone.')) return;
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LOG_KEY);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem('gameInventory');
    localStorage.removeItem('gameCash');
    localStorage.removeItem('gameCraftJobs');
    localStorage.removeItem('gameMissions');
    logAction('Game reset');
    location.reload();
  }

  // Main init
  document.addEventListener('DOMContentLoaded', async () => {
    await ensureStats();

    // Settings toggles
    const settings = loadSettings();
    renderSettings(settings);
    logAction('Settings page opened');

    document.getElementById('toggle-notif').addEventListener('change', e => {
      settings.notifications = e.target.checked;
      saveSettings(settings);
      logAction(`Notifications ${settings.notifications ? 'enabled' : 'disabled'}`);
    });
    document.getElementById('toggle-autosave').addEventListener('change', e => {
      settings.autoSave = e.target.checked;
      saveSettings(settings);
      logAction(`Auto‑Save ${settings.autoSave ? 'enabled' : 'disabled'}`);
    });

    // Buttons
    document.getElementById('btn-clear-log').onclick  = clearLog;
    document.getElementById('btn-export-log').onclick = exportLog;
    document.getElementById('btn-reset-game').onclick = resetGame;

    renderLog();
  });
})();

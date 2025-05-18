// settings.js

(async function(){
  const SETTINGS_KEY = 'gameSettings';
  const LOG_KEY      = 'gameLog';
  const STATS_KEY    = 'gameStats';
  const STATS_JSON   = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/stats.json';

  const SAVE_KEYS = [
    'gameStats',
    'gameInventory',
    'gameCash',
    'gameCraftJobs',
    'gameMissions',
    'gameSettings',
    'gameLog'
  ];

  let DEFAULT_STATS = null;

  // Fetch JSON with cache‑bust
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

  // Ensure stats are initialized
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

  // Export entire save
  function exportSave() {
    const saveObj = {};
    SAVE_KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        saveObj[key] = JSON.parse(raw);
      }
    });
    const blob = new Blob([JSON.stringify(saveObj, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'out-after-dark-save.json';
    a.click();
    URL.revokeObjectURL(url);
    logAction('Save exported');
  }

  // Handle import
  function importSave(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        SAVE_KEYS.forEach(key => {
          if (obj[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(obj[key]));
          }
        });
        alert('Save imported! Reloading…');
        logAction('Save imported');
        location.reload();
      } catch {
        alert('Invalid save file.');
      }
    };
    reader.readAsText(file);
  }

  // Reset game
  function resetGame() {
    if (!confirm('Reset entire game? This cannot be undone.')) return;
    SAVE_KEYS.forEach(k => localStorage.removeItem(k));
    logAction('Game reset');
    location.reload();
  }

  // Initialization on load
  document.addEventListener('DOMContentLoaded', async () => {
    await ensureStats();

    // Render and log page open
    const settings = loadSettings();
    renderSettings(settings);
    logAction('Settings page opened');

    // Toggle handlers
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
    document.getElementById('btn-export-log').onclick = exportSave;
    document.getElementById('btn-reset-game').onclick = resetGame;

    // Import file input (if present)
    const fileInput = document.getElementById('save-file');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        if (e.target.files[0]) importSave(e.target.files[0]);
      });
    }

    // Render log
    renderLog();
  });
})();

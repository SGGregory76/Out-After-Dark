(function(){
  // Settings & Log Module for Survivor OS
  const SETTINGS_KEY = 'gameSettings';
  const LOG_KEY      = 'gameLog';

  // Default settings
  const defaultSettings = {
    notifications: true,
    autoSave: true
  };

  // Load settings from localStorage or defaults
  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      return Object.assign({}, defaultSettings, stored);
    } catch {
      return { ...defaultSettings };
    }
  }

  // Save settings to localStorage
  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // Logging utilities
  function loadLog() {
    try {
      return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveLog(log) {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }
  function addLogEntry(message) {
    const log = loadLog();
    const timestamp = Date.now();
    log.unshift({ timestamp, message });
    if (log.length > 100) log.pop();
    saveLog(log);
  }

  // Render settings toggles
  function renderSettings(settings) {
    const notif = document.getElementById('toggle-notif');
    const autosave = document.getElementById('toggle-autosave');
    if (notif) notif.checked = settings.notifications;
    if (autosave) autosave.checked = settings.autoSave;
  }

  // Render log entries
  function renderLog() {
    const container = document.getElementById('log-list');
    if (!container) return;
    const log = loadLog();
    container.innerHTML = log.length === 0
      ? '<div class="log-empty">No log entries</div>'
      : log.map(entry => {
          const date = new Date(entry.timestamp).toLocaleString();
          return `<div class='log-entry'><span class='log-time'>${date}</span> - ${entry.message}</div>`;
        }).join('');
  }

  // Initialize event handlers
  function initHandlers() {
    const settings = loadSettings();
    renderSettings(settings);
    renderLog();

    // Notification toggle
    const notifToggle = document.getElementById('toggle-notif');
    if (notifToggle) {
      notifToggle.addEventListener('change', e => {
        settings.notifications = e.target.checked;
        saveSettings(settings);
        addLogEntry(`Notifications ${settings.notifications ? 'enabled' : 'disabled'}`);
        renderLog();
      });
    }

    // Auto-save toggle
    const autoToggle = document.getElementById('toggle-autosave');
    if (autoToggle) {
      autoToggle.addEventListener('change', e => {
        settings.autoSave = e.target.checked;
        saveSettings(settings);
        addLogEntry(`Auto-save ${settings.autoSave ? 'enabled' : 'disabled'}`);
        renderLog();
      });
    }

    // Clear log button
    const clearBtn = document.getElementById('btn-clear-log');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all log entries?')) {
          localStorage.removeItem(LOG_KEY);
          addLogEntry('Log cleared');
          renderLog();
        }
      });
    }

    // Export log button
    const exportBtn = document.getElementById('btn-export-log');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const log = loadLog();
        const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'survivor-os-log.json';
        a.click();
        URL.revokeObjectURL(url);
        addLogEntry('Log exported');
        renderLog();
      });
    }
  }

  // Auto-init when page contains settings container
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('settings-container')) {
      initHandlers();
      addLogEntry('Settings page opened');
      renderLog();
    }
  });
})();

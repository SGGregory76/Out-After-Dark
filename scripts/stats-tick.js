(function(){
  const STATS_KEY       = 'gameStats';
  const STATS_JSON_URL  = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/stats.json';
  let   DEFAULT_STATS   = null;
  let   gameOverTriggered = false;

  // Load default stats schema from stats.json
  async function loadDefaults() {
    if (DEFAULT_STATS) return;
    const res  = await fetch(`${STATS_JSON_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading stats.json`);
    const json = await res.json();
    DEFAULT_STATS = json.defaultStats;
  }

  // Load player stats, initializing with defaults if missing
  async function loadStats() {
    await loadDefaults();
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try {
        return Object.assign({}, DEFAULT_STATS, JSON.parse(raw));
      } catch {
        // fall through to reinitialize
      }
    }
    // first‑time setup
    localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
    return { ...DEFAULT_STATS };
  }

  // Save stats back to localStorage
  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // Render stats both to hidden spans (if any) and to the hub
  function renderStats(s) {
    const icons = {
      health:   '&#10084;', // ❤
      stamina:  '💪',
      hunger:   '🍗',
      thirst:   '💧',
      rep:      '🤝',
      heat:     '🔥',
      cash:     '💵'
    };
    Object.keys(icons).forEach(key => {
      // hidden span id=stat-{key}
      const hid = document.getElementById(`stat-${key}`);
      if (hid) {
        if (key==='health' || key==='stamina') {
          const maxKey = key==='health' ? 'maxHealth' : 'maxStamina';
          hid.textContent = `${icons[key]} ${s[key]}/${s[maxKey]}`;
        } else {
          hid.textContent = `${icons[key]} ${s[key]}`;
        }
      }
      // visible hub id=hub-{key}
      const hub = document.getElementById(`hub-${key}`);
      if (hub) {
        if (key==='health' || key==='stamina') {
          const maxKey = key==='health' ? 'maxHealth' : 'maxStamina';
          hub.innerHTML = `${icons[key]} ${s[key]}/${s[maxKey]}`;
        } else {
          hub.textContent = `${icons[key]} ${s[key]}`;
        }
      }
    });
  }

  // The periodic tick logic
  async function tick() {
    const s = await loadStats();
    // apply decay/regeneration rules
    s.hunger = Math.min(100, s.hunger + 1);
    s.thirst = Math.min(100, s.thirst + 1);
    if (s.hunger > 80 || s.thirst > 80) {
      s.health = Math.max(0, s.health - 1);
    }
    s.stamina = Math.min(s.maxStamina, s.stamina + 2);

    saveStats(s);
    renderStats(s);

    // Game Over check
    if (!gameOverTriggered && s.health <= 0) {
      gameOverTriggered = true;
      setTimeout(() => {
        if (confirm('Game Over! Your character has died. Restart the game?')) {
          // clear all relevant keys
          [
            STATS_KEY,
            'gameInventory',
            'gameCraftJobs',
            'gameMissions',
            'gameLog',
            'gameSettings',
            'gameCash'
          ].forEach(k => localStorage.removeItem(k));
          location.reload();
        }
      }, 200);
    }
  }

  // Expose API
  window.StatsTick = {
    renderStats,
    init: async function(intervalMs = 60000) {
      const s = await loadStats();
      renderStats(s);
      if (!gameOverTriggered && s.health <= 0) {
        gameOverTriggered = true;
        setTimeout(() => {
          if (confirm('Game Over! Your character has died. Restart the game?')) {
            [
              STATS_KEY,
              'gameInventory',
              'gameCraftJobs',
              'gameMissions',
              'gameLog',
              'gameSettings',
              'gameCash'
            ].forEach(k => localStorage.removeItem(k));
            location.reload();
          }
        }, 200);
      }
      setInterval(tick, intervalMs);
    }
  };

  // Listen for external updates
  window.addEventListener('storage', async e => {
    if (e.key === STATS_KEY) {
      const s = await loadStats();
      renderStats(s);
    }
  });
  window.addEventListener('statsUpdated', async e => {
    await loadDefaults();
    renderStats(Object.assign({}, DEFAULT_STATS, e.detail));
  });

  // Auto‑init if relevant spans/hub exist
  document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('stat-health') || document.getElementById('hub-health')) {
      await StatsTick.init();
    }
  });
})();

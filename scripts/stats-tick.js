(function(){
  const STATS_KEY        = 'gameStats';
  const STATS_JSON_URL   = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/stats.json';
  let   DEFAULT_STATS    = null;
  let   gameOverTriggered = false;

  // Load default stats schema from stats.json
  async function loadDefaults() {
    if (DEFAULT_STATS) return;
    const res  = await fetch(`${STATS_JSON_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading stats.json`);
    const json = await res.json();
    DEFAULT_STATS = json.defaultStats;
  }

  // Load player stats, initializing with defaults if missing or schema‑mismatched
  async function loadStats() {
    await loadDefaults();
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Ensure all required keys exist
        const required = ['health','maxHealth','energy','maxEnergy','atk','def','cash','heat','rep','rp','xp','level'];
        const hasAll = required.every(k => k in parsed);
        if (!hasAll) throw new Error('old schema');
        // Merge defaults and existing
        return Object.assign({}, DEFAULT_STATS, parsed);
      } catch {
        // invalid JSON or old schema => reinitialize
      }
    }
    // first‑time setup or after schema mismatch
    localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
    return { ...DEFAULT_STATS };
  }

  // Save stats back to localStorage
  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // Render stats to hub
  function renderStats(s) {
    const icons = {
      health:   '❤',
      energy:   '⚡',
      atk:      '🥊',
      def:      '🛡️',
      rp:       '🧪',
      xp:       '⭐',
      level:    '🎚️',
      cash:     '💵',
      heat:     '🔥',
      rep:      '🧢'
    };

    Object.keys(icons).forEach(key => {
      const hub = document.getElementById(`hub-${key}`);
      if (hub) {
        if (key==='health'||key==='energy') {
          const maxKey = key==='health'?'maxHealth':'maxEnergy';
          hub.innerText = `${icons[key]} ${s[key]}/${s[maxKey]}`;
        } else {
          hub.innerText = `${icons[key]} ${s[key]}`;
        }
      }
    });
  }

  // Periodic tick: regen energy
  async function tick() {
    const s = await loadStats();
    s.energy = Math.min(s.maxEnergy, s.energy + 1);
    saveStats(s);
    renderStats(s);

    if (!gameOverTriggered && s.health <= 0) {
      gameOverTriggered = true;
      setTimeout(() => {
        if (confirm('Game Over! Your character has died. Restart the game?')) {
          [STATS_KEY,'gameInventory','gameCraftJobs','gameMissions','gameLog','gameSettings','gameCash']
            .forEach(k=>localStorage.removeItem(k));
          location.reload();
        }
      },200);
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
            [STATS_KEY,'gameInventory','gameCraftJobs','gameMissions','gameLog','gameSettings','gameCash']
              .forEach(k=>localStorage.removeItem(k));
            location.reload();
          }
        },200);
      }
      setInterval(tick, intervalMs);
    }
  };

  // Listen storage and custom events
  window.addEventListener('storage', async e => {
    if (e.key===STATS_KEY) {
      try { renderStats(await loadStats()); } catch {};
    }
  });
  window.addEventListener('statsUpdated', async e => {
    await loadDefaults();
    renderStats(Object.assign({}, DEFAULT_STATS, e.detail));
  });

  // Auto‑init on DOM
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.StatsTick && typeof StatsTick.init==='function') {
      await StatsTick.init();
    }
  });
})();

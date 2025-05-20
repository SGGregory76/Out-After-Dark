(function(){
  const STATS_KEY        = 'gameStats';
  const STATS_JSON_URL   = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/stats.json';
  let   DEFAULT_STATS    = null;
  let   gameOverTriggered = false;

  // 1) Fetch and cache the default schema
  async function loadDefaults() {
    if (DEFAULT_STATS) return;
    const res = await fetch(`${STATS_JSON_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading stats.json`);
    const json = await res.json();
    DEFAULT_STATS = json.defaultStats;
  }

  // 2) Load saved stats or initialize if missing/old‐schema
  async function loadStats() {
    await loadDefaults();
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Validate schema
        const required = [
          'health','maxHealth',
          'energy','maxEnergy',
          'atk','def',
          'cash','heat','rep','rp',
          'xp','level'
        ];
        const hasAll = required.every(k => k in parsed);
        if (!hasAll) throw new Error('old schema');

        // Merge any missing new defaults, just in case
        return Object.assign({}, DEFAULT_STATS, parsed);
      } catch {
        // invalid JSON or old schema → fall through
      }
    }
    // First run or after schema mismatch: write defaults
    localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
    return { ...DEFAULT_STATS };
  }

  // 3) Save & render helpers
  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  function renderStats(s) {
    const icons = {
      health: '❤', energy: '⚡',
      atk: '🥊', def: '🛡️',
      rp: '🧪', xp: '⭐', level: '🎚️',
      cash: '💵', heat: '🔥', rep: '🧢'
    };
    Object.keys(icons).forEach(key => {
      const el = document.getElementById(`hub-${key}`);
      if (!el) return;
      if (key==='health' || key==='energy') {
        const mx = key==='health' ? 'maxHealth' : 'maxEnergy';
        el.innerText = `${icons[key]} ${s[key]}/${s[mx]}`;
      } else {
        el.innerText = `${icons[key]} ${s[key]}`;
      }
    });
  }

  // 4) Periodic tick (energy regen + game over)
  async function tick() {
    const s = await loadStats();
    s.energy = Math.min(s.maxEnergy, s.energy + 1);
    saveStats(s);
    renderStats(s);

    if (!gameOverTriggered && s.health <= 0) {
      gameOverTriggered = true;
      setTimeout(() => {
        if (confirm('Game Over! Your character has died. Restart the game?')) {
          [
            STATS_KEY, 'gameInventory', 'gameCraftJobs',
            'gameMissions', 'gameLog', 'gameSettings', 'gameCash'
          ].forEach(k => localStorage.removeItem(k));
          location.reload();
        }
      }, 200);
    }
  }

  // 5) Expose API & wire events
  window.StatsTick = {
    renderStats,
    init: async function(intervalMs = 60000) {
      const s = await loadStats();
      renderStats(s);
      if (!gameOverTriggered && s.health <= 0) {
        gameOverTriggered = true;
        // same game over logic...
      }
      setInterval(tick, intervalMs);
    }
  };

  window.addEventListener('storage', e => {
    if (e.key === STATS_KEY) {
      loadStats().then(renderStats).catch(() => {});
    }
  });
  window.addEventListener('statsUpdated', e => {
    renderStats(Object.assign({}, DEFAULT_STATS, e.detail));
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (window.StatsTick?.init) {
      StatsTick.init();
    }
  });
})();

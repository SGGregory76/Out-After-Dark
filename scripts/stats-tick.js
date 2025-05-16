(function(){
  // Stats Tick module with live updates and Game Over
  const STATS_KEY = 'gameStats';
  const DEFAULT_STATS = {
    health: 100, maxHealth: 100,
    stamina: 100, maxStamina: 100,
    hunger: 0, thirst: 0,
    rep: 0, heat: 0,
    cash: 0, xp: 0, level: 1,
    carryWeight: 0, maxCarryWeight: 50
  };
  let gameOverTriggered = false;

  // Load stats (or initialize defaults)
  async function loadStats() {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        return Object.assign({}, DEFAULT_STATS, obj);
      } catch {
        return { ...DEFAULT_STATS };
      }
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
    return { ...DEFAULT_STATS };
  }

  // Save stats
  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // Render stats into the DOM
  function renderStats(stats) {
    const updates = [
      { id: 'stat-health',    text: `❤️ ${stats.health}/${stats.maxHealth}` },
      { id: 'stat-stamina',   text: `💪 ${stats.stamina}/${stats.maxStamina}` },
      { id: 'stat-hunger',    text: `🍗 ${stats.hunger}` },
      { id: 'stat-thirst',    text: `💧 ${stats.thirst}` },
      { id: 'stat-rep',       text: `🤝 ${stats.rep}` },
      { id: 'stat-heat',      text: `🔥 ${stats.heat}` },
      { id: 'stat-cash',      text: `💵 $${stats.cash}` }
    ];
    updates.forEach(u => {
      const el = document.getElementById(u.id);
      if (el) el.textContent = u.text;
    });
  }

  // The main tick function
  async function tick() {
    const stats = await loadStats();

    // Hunger & Thirst increase
    stats.hunger = Math.min(100, stats.hunger + 1);
    stats.thirst = Math.min(100, stats.thirst + 1);

    // Health decay
    if (stats.hunger > 80 || stats.thirst > 80) {
      stats.health = Math.max(0, stats.health - 1);
    }

    // Stamina regen
    stats.stamina = Math.min(stats.maxStamina, stats.stamina + 2);

    saveStats(stats);
    renderStats(stats);

    // Game Over check
    if (!gameOverTriggered && stats.health <= 0) {
      gameOverTriggered = true;
      setTimeout(() => {
        if (confirm('Game Over! Your character has died. Restart the game?')) {
          // Clear all game data keys
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

  // Expose init & renderStats
  window.StatsTick = {
    renderStats,
    init: function(intervalMs = 60000) {
      // Initial render & immediate game-over check
      loadStats().then(s => {
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
      });
      // Start periodic ticks
      setInterval(tick, intervalMs);
    }
  };

  // Listen for storage events (other scripts/iframes)
  window.addEventListener('storage', e => {
    if (e.key === STATS_KEY && !gameOverTriggered) {
      try {
        const newStats = JSON.parse(e.newValue);
        renderStats(Object.assign({}, DEFAULT_STATS, newStats));
      } catch {}
    }
  });

  // Listen for custom 'statsUpdated' events
  window.addEventListener('statsUpdated', e => {
    renderStats(Object.assign({}, DEFAULT_STATS, e.detail));
  });

  // Auto‑init if stats elements are present
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stat-health')) {
      window.StatsTick.init();
    }
  });
})();

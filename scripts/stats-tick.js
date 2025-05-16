(function(){
  // Stats Tick module with Game Over
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

  async function loadDefaults() {
    // Optionally fetch defaults from JSON; fallback to DEFAULT_STATS
    return DEFAULT_STATS;
  }

  async function loadStats() {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) return JSON.parse(saved);
    const defaults = await loadDefaults();
    localStorage.setItem(STATS_KEY, JSON.stringify(defaults));
    return defaults;
  }

  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  function renderStats(stats) {
    const m = stats;
    const updates = [
      { id: 'stat-health',    text: `❤️ ${m.health}/${m.maxHealth}` },
      { id: 'stat-stamina',   text: `💪 ${m.stamina}/${m.maxStamina}` },
      { id: 'stat-hunger',    text: `🍗 ${m.hunger}` },
      { id: 'stat-thirst',    text: `💧 ${m.thirst}` },
      { id: 'stat-rep',       text: `🤝 ${m.rep}` },
      { id: 'stat-heat',      text: `🔥 ${m.heat}` },
      { id: 'stat-cash',      text: `💵 $${m.cash}` }
    ];
    updates.forEach(u => {
      const el = document.getElementById(u.id);
      if (el) el.textContent = u.text;
    });
  }

  async function tick() {
    const stats = await loadStats();
    // Hunger & Thirst increase
    stats.hunger = Math.min(100, stats.hunger + 1);
    stats.thirst = Math.min(100, stats.thirst + 1);
    // Health decay if hungry or thirsty
    if (stats.hunger > 80 || stats.thirst > 80) {
      stats.health = Math.max(0, stats.health - 1);
    }
    // Stamina regen if resting
    stats.stamina = Math.min(stats.maxStamina, stats.stamina + 2);

    // Save and render
    saveStats(stats);
    renderStats(stats);

    // Check Game Over
    if (!gameOverTriggered && stats.health <= 0) {
      gameOverTriggered = true;
      setTimeout(() => {
        if (confirm('Game Over! Your character has died. Restart the game?')) {
          // Clear game data
          const keys = [STATS_KEY, 'gameInventory', 'gameCraftJobs', 'gameMissions', 'gameLog', 'gameSettings', 'gameCash'];
          keys.forEach(k => localStorage.removeItem(k));
          location.reload();
        }
      }, 200);
    }
  }

  window.StatsTick = {
    init: function(intervalMs = 60000) {
+    // Initial render and immediate Game Over check
+    loadStats().then(s => {
+      renderStats(s);
+      // If already dead, trigger game over prompt right away
+      if (!gameOverTriggered && s.health <= 0) {
+        gameOverTriggered = true;
+        setTimeout(() => {
+          if (confirm('Game Over! Your character has died. Restart the game?')) {
+            const keys = [
+              STATS_KEY, 'gameInventory', 'gameCraftJobs',
+              'gameMissions', 'gameLog', 'gameSettings', 'gameCash'
+            ];
+            keys.forEach(k => localStorage.removeItem(k));
+            location.reload();
+          }
+        }, 200);
+      }
+    });
+    // Continue regular ticking
+    setInterval(tick, intervalMs);
+  }


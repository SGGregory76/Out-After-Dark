(function(){
  const STATS_KEY = 'gameStats';
  const STATS_URL = 'https://raw.githubusercontent.com/SGGregory76/Out-After-Dark/main/data/stats.json'
                  + '?t=' + Date.now();

  // Load defaults from stats.json if needed
  async function loadDefaults() {
    const res = await fetch(STATS_URL);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  async function loadStats() {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    } else {
      // First time: fetch defaults
      const defaults = await loadDefaults();
      localStorage.setItem(STATS_KEY, JSON.stringify(defaults));
      return defaults;
    }
  }

  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  function renderStats(stats) {
    const m = stats;
    [
      { id: 'stat-health',    text: `❤️ ${m.health}/${m.maxHealth}` },
      { id: 'stat-stamina',   text: `💪 ${m.stamina}/${m.maxStamina}`},
      { id: 'stat-hunger',    text: `🍗 ${m.hunger}` },
      { id: 'stat-thirst',    text: `💧 ${m.thirst}` },
      { id: 'stat-rep',       text: `🤝 ${m.rep}` },
      { id: 'stat-heat',      text: `🔥 ${m.heat}` },
      { id: 'stat-cash',      text: `💵 $${m.cash}` }
    ].forEach(u => {
      const el = document.getElementById(u.id);
      if (el) el.textContent = u.text;
    });
  }

  async function tick() {
    const stats = await loadStats();
    stats.hunger = Math.min(100, stats.hunger + 1);
    stats.thirst = Math.min(100, stats.thirst + 1);
    if (stats.hunger > 80 || stats.thirst > 80) {
      stats.health = Math.max(0, stats.health - 1);
    }
    stats.stamina = Math.min(stats.maxStamina, stats.stamina + 2);
    saveStats(stats);
    renderStats(stats);
  }

  window.StatsTick = {
    init: function(intervalMs = 60000) {
      loadStats().then(s => renderStats(s))
                  .catch(e => console.error('Stats init error', e));
      setInterval(tick, intervalMs);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stat-health')) {
      StatsTick.init();
    }
  });
})();


(function(){
  const STATS_KEY = 'gameStats';
  const DEFAULT_STATS = {
    health:100, maxHealth:100,
    stamina:100, maxStamina:100,
    hunger:0, thirst:0,
    rep:0, heat:0,
    cash:0, xp:0, level:1,
    carryWeight:0, maxCarryWeight:50
  };
  let gameOver = false;

  async function loadStats() {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try { return Object.assign({}, DEFAULT_STATS, JSON.parse(raw)); }
      catch {} 
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
    return { ...DEFAULT_STATS };
  }

  function saveStats(s) {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  }

  function renderStats(s) {
    // If you still have hidden stat- spans, update them:
    ['health','stamina','hunger','thirst','rep','heat','cash'].forEach(key => {
      const el = document.getElementById('stat-'+key);
      if (el) {
        const icons = {
          health: '❤', stamina: '💪',
          hunger: '🍗', thirst: '💧',
          rep: '🤝', heat: '🔥',
          cash: '💵'
        };
        let text = icons[key] + ' ';
        if (key==='health' || key==='stamina')
          text += `${s[key]}/${s['max'+key.charAt(0).toUpperCase()+key.slice(1)]}`;
        else text += s[key];
        el.textContent = text;
      }
    });

    // Now update your visible hub directly:
    const hub = {
      health:   document.getElementById('hub-health'),
      stamina:  document.getElementById('hub-stamina'),
      hunger:   document.getElementById('hub-hunger'),
      thirst:   document.getElementById('hub-thirst'),
      rep:      document.getElementById('hub-rep'),
      heat:     document.getElementById('hub-heat'),
      cash:     document.getElementById('hub-cash')
    };
    if (hub.health)   hub.health.innerHTML   = `&#10084; ${s.health}/${s.maxHealth}`;
    if (hub.stamina)  hub.stamina.textContent= `💪 ${s.stamina}/${s.maxStamina}`;
    if (hub.hunger)   hub.hunger.textContent = `🍗 ${s.hunger}`;
    if (hub.thirst)   hub.thirst.textContent = `💧 ${s.thirst}`;
    if (hub.rep)      hub.rep.textContent    = `🤝 ${s.rep}`;
    if (hub.heat)     hub.heat.textContent   = `🔥 ${s.heat}`;
    if (hub.cash)     hub.cash.textContent   = `💵 $${s.cash}`;
  }

  async function tick() {
    const s = await loadStats();
    // natural decay/regeneration
    s.hunger = Math.min(100, s.hunger + 1);
    s.thirst = Math.min(100, s.thirst + 1);
    if (s.hunger>80||s.thirst>80) s.health = Math.max(0, s.health - 1);
    s.stamina = Math.min(s.maxStamina, s.stamina + 2);

    saveStats(s);
    renderStats(s);

    if (!gameOver && s.health<=0) {
      gameOver = true;
      setTimeout(()=>{
        if (confirm('Game Over! Restart?')) {
          ['gameStats','gameInventory','gameCraftJobs','gameMissions','gameLog','gameSettings','gameCash']
            .forEach(k=>localStorage.removeItem(k));
          location.reload();
        }
      },200);
    }
  }

  window.StatsTick = {
    renderStats, 
    init: function(intervalMs=60000){
      loadStats().then(s=>{
        renderStats(s);
        if (!gameOver && s.health<=0) {
          gameOver = true;
          setTimeout(()=>{ if(confirm('Game Over! Restart?')) location.reload(); },200);
        }
      });
      setInterval(tick,intervalMs);
    }
  };

  // live‐update on storage or custom events
  window.addEventListener('storage', e=>{
    if(e.key===STATS_KEY) loadStats().then(renderStats);
  });
  window.addEventListener('statsUpdated', e=>renderStats(Object.assign({},DEFAULT_STATS,e.detail)));

  // auto‑init if your theme loaded the spans
  document.addEventListener('DOMContentLoaded',()=>{
    if(document.getElementById('hub-health')||document.getElementById('stat-health')){
      StatsTick.init();
    }
  });
})();

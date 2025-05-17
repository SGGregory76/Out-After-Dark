(async function(){
  const ITEMS_URL    = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/inventory.json';
  const STATS_JSON   = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/stats.json';
  const INV_KEY      = 'gameInventory';
  const CASH_KEY     = 'gameCash';
  const STATS_KEY    = 'gameStats';
  const LOG_KEY      = 'gameLog';

  let DEFAULT_STATS = null;

  // Fetch JSON with cache‑bust
  async function fetchJSON(url){
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
  }

  // Load default stats schema once
  async function loadDefaults(){
    if (DEFAULT_STATS) return;
    const json = await fetchJSON(STATS_JSON);
    DEFAULT_STATS = json.defaultStats;
  }

  // Load and merge stats
  async function loadStats(){
    await loadDefaults();
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try {
        return Object.assign({}, DEFAULT_STATS, JSON.parse(raw));
      } catch {}
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
    return { ...DEFAULT_STATS };
  }

  function saveStats(stats){
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  function loadState(){
    return {
      inv: JSON.parse(localStorage.getItem(INV_KEY)||'{}'),
      cash: parseInt(localStorage.getItem(CASH_KEY)||'0',10),
      stats: null  // will load next
    };
  }

  function saveState(state){
    localStorage.setItem(INV_KEY, JSON.stringify(state.inv));
    localStorage.setItem(CASH_KEY, state.cash);
    saveStats(state.stats);
  }

  function logAction(message){
    const raw = localStorage.getItem(LOG_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({ time: new Date().toISOString(), message });
    if (log.length > 200) log.pop();
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }

  function renderStats(stats){
    window.dispatchEvent(new CustomEvent('statsUpdated', { detail: stats }));
  }

  function renderInventory(data, state){
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    data.inventory.forEach(item => {
      const qty = state.inv[item.id] ?? item.quantity;
      if (qty <= 0) return;

      const card = document.createElement('div');
      card.className = 'inventory-card';
      card.innerHTML = `
        <div class="icon">${item.icon}</div>
        <div class="name">${item.name}</div>
        <div class="qty">x${qty}</div>
        <button data-act="use">Use</button>
        <button data-act="sell">Sell $${item.unitValue}</button>
        <button data-act="discard">Discard</button>
      `;
      const [useBtn, sellBtn, disBtn] = card.querySelectorAll('button');

      // USE
      useBtn.disabled = !item.usable || qty <= 0;
      useBtn.addEventListener('click', async () => {
        state.inv[item.id] = qty - 1;
        // apply effect
        const e = item.usable;
        if (e) {
          if (e.hungerRegen)  state.stats.hunger = Math.max(0, state.stats.hunger - e.hungerRegen);
          if (e.thirstRegen)  state.stats.thirst = Math.max(0, state.stats.thirst - e.thirstRegen);
          if (e.healAmount)   state.stats.health = Math.min(state.stats.maxHealth, state.stats.health + e.healAmount);
          if (e.euphoria) {
            state.stats.stamina = Math.min(state.stats.maxStamina, state.stats.stamina + (e.staminaRegen||0));
            state.stats.stealthBonus = (state.stats.stealthBonus||0) + (e.stealthBonus||0);
            setTimeout(() => {
              state.stats.stealthBonus -= e.stealthBonus||0;
              saveState(state);
            }, e.durationMinutes * 60000);
          }
        }
        saveState(state);
        logAction(`Used ${item.name}`);
        renderStats(state.stats);
        renderInventory(data, state);
      });

      // SELL
      sellBtn.disabled = !item.sellable || qty <= 0;
      sellBtn.addEventListener('click', () => {
        state.cash += item.unitValue;
        state.inv[item.id] = qty - 1;
        saveState(state);
        logAction(`Sold ${item.name} for $${item.unitValue}`);
        renderStats(state.stats);
        renderInventory(data, state);
      });

      // DISCARD
      disBtn.disabled = qty <= 0;
      disBtn.addEventListener('click', () => {
        state.inv[item.id] = qty - 1;
        saveState(state);
        logAction(`Discarded ${item.name}`);
        renderInventory(data, state);
      });

      grid.appendChild(card);
    });

    if (!grid.querySelector('.inventory-card')) {
      grid.innerHTML = '<div class="error">No items in inventory.</div>';
    }
  }

  // Initialization
  async function init(){
    try {
      const data = await fetchJSON(ITEMS_URL);
      const state = loadState();
      state.stats = await loadStats();
      renderStats(state.stats);
      renderInventory(data, state);
    } catch (err) {
      document.getElementById('inventory-grid').innerHTML =
        `<div class="error">Error loading inventory:<br>${err.message}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

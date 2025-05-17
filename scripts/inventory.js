(async function(){
  const ITEMS_URL = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/items.json';
  const INV_KEY   = 'gameInventory';
  const CASH_KEY  = 'gameCash';
  const STATS_KEY = 'gameStats';
  const LOG_KEY   = 'gameLog';

  /*** Storage & Logging Helpers ***/
  async function fetchJSON(url){
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
  }

  function loadState(){
    return {
      inv: JSON.parse(localStorage.getItem(INV_KEY) || '{}'),
      cash: parseInt(localStorage.getItem(CASH_KEY) || '0',10),
      stats: JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
    };
  }
  function saveState({inv, cash, stats}){
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
    localStorage.setItem(CASH_KEY, cash);
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  function logAction(message){
    const raw = localStorage.getItem(LOG_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({ time: new Date().toISOString(), message });
    if (log.length > 100) log.pop();
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }

  /*** Stats & Rendering ***/
  function renderStats(stats){
    // update shell stats via custom event or storage listener
    window.dispatchEvent(new CustomEvent('statsUpdated', { detail: stats }));
  }

  function renderInventory(items, state){
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    items.forEach(item => {
      const qty = state.inv[item.id] || 0;
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
      useBtn.addEventListener('click', () => {
        // consume
        state.inv[item.id] = qty - 1;
        // apply effect
        const effect = item.usable;
        if (effect) {
          // hunger
          if (effect.hungerRegen) {
            state.stats.hunger = Math.max(0, state.stats.hunger - effect.hungerRegen);
          }
          // thirst
          if (effect.thirstRegen) {
            state.stats.thirst = Math.max(0, state.stats.thirst - effect.thirstRegen);
          }
          // heal
          if (effect.healAmount) {
            state.stats.health = Math.min(state.stats.maxHealth, state.stats.health + effect.healAmount);
          }
          // euphoria
          if (effect.euphoria) {
            state.stats.stamina = Math.min(state.stats.maxStamina, state.stats.stamina + (effect.staminaRegen||0));
            state.stats.stealthBonus = (state.stats.stealthBonus||0) + (effect.stealthBonus||0);
            setTimeout(() => {
              state.stats.stealthBonus -= effect.stealthBonus||0;
              saveState(state);
            }, effect.durationMinutes * 60000);
          }
        }
        saveState(state);
        logAction(`Used ${item.name}`);
        renderStats(state.stats);
        renderInventory(items, state);
      });

      // SELL
      sellBtn.disabled = !item.sellable || qty <= 0;
      sellBtn.addEventListener('click', () => {
        state.cash += item.unitValue;
        state.inv[item.id] = qty - 1;
        saveState(state);
        logAction(`Sold ${item.name} for $${item.unitValue}`);
        renderStats(state.stats);
        renderInventory(items, state);
      });

      // DISCARD
      disBtn.disabled = qty <= 0;
      disBtn.addEventListener('click', () => {
        state.inv[item.id] = qty - 1;
        saveState(state);
        logAction(`Discarded ${item.name}`);
        renderInventory(items, state);
      });

      grid.appendChild(card);
    });

    if (!grid.querySelector('.inventory-card')) {
      grid.innerHTML = '<div class="error">No items in inventory.</div>';
    }
  }

  /*** Init ***/
  async function init(){
    try {
      const itemsData = await fetchJSON(ITEMS_URL);
      const state = loadState();
      // ensure stat defaults
      state.stats = Object.assign({
        health:100, maxHealth:100,
        stamina:100, maxStamina:100,
        hunger:0, thirst:0
      }, state.stats);
      saveState(state);
      renderStats(state.stats);
      renderInventory(itemsData.inventory || itemsData, state);
    } catch(e){
      document.getElementById('inventory-grid').innerHTML =
        `<div class="error">Error loading inventory:<br>${e.message}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('inventory-grid')) {
      init();
    }
  });
})();

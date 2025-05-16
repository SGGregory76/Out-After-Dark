(async function(){
  const ITEMS_URL = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/inventory.json';
  const INV_KEY   = 'gameInventory';
  const CASH_KEY  = 'gameCash';
  const STATS_KEY = 'gameStats';

  // Helper: fetch JSON with cache-bust
  async function fetchJSON(url) {
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
  }

  // Load or initialize state
  function loadState() {
    return {
      inv: JSON.parse(localStorage.getItem(INV_KEY)||'{}'),
      cash: +localStorage.getItem(CASH_KEY)||0,
      stats: JSON.parse(localStorage.getItem(STATS_KEY)||'{}')
    };
  }
  function saveState({inv, cash, stats}) {
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
    localStorage.setItem(CASH_KEY, cash);
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // Apply an item's effect to player stats
  function applyEffect(effect, stats) {
    if (effect.hungerRegen) {
      stats.hunger = Math.max(0, stats.hunger - effect.hungerRegen);
    }
    if (effect.thirstRegen) {
      stats.thirst = Math.max(0, stats.thirst - effect.thirstRegen);
    }
    if (effect.healAmount) {
      stats.health = Math.min(stats.maxHealth, stats.health + effect.healAmount);
    }
    if (effect.euphoria) {
      // euphoria effect for duration
      stats.stamina = Math.min(stats.maxStamina, stats.stamina + (effect.staminaRegen || 0));
      stats.stealthBonus = (stats.stealthBonus || 0) + (effect.stealthBonus || 0);
      // schedule removal after duration
      setTimeout(() => {
        stats.stealthBonus -= effect.stealthBonus || 0;
        saveState({inv:state.inv, cash: state.cash, stats});
      }, effect.durationMinutes * 60000);
    }
    saveState({inv: state.inv, cash: state.cash, stats});
  }

  // Render stats bar (cash only here for brevity)
  function renderStats(stats) {
    document.getElementById('stat-cash').textContent = `💵 $${state.cash}`;
    // You can also render health, hunger, thirst, etc. if you include those spans
  }

  // Render inventory grid
  function renderInventory(items, state) {
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
        <button data-act="sell">Sell $${item.baseValue}</button>
        <button data-act="discard">Discard</button>
      `;
      const [useBtn, sellBtn, disBtn] = card.querySelectorAll('button');
      useBtn.disabled = !(item.effect);
      sellBtn.disabled = !item.sellable || qty <= 0;
      disBtn.disabled = qty <= 0;

      useBtn.onclick = () => {
        // consume one
        state.inv[item.id] = qty - 1;
        applyEffect(item.effect, state.stats);
        init(); // re-render
      };
      sellBtn.onclick = () => {
        state.cash += item.baseValue;
        state.inv[item.id] = qty - 1;
        saveState(state);
        init();
      };
      disBtn.onclick = () => {
        state.inv[item.id] = qty - 1;
        saveState(state);
        init();
      };
      grid.appendChild(card);
    });
    if (!grid.querySelector('.inventory-card')) {
      grid.innerHTML = '<div class="error">No items in inventory.</div>';
    }
  }

  // Main init
  let state;
  async function init(){
    try {
      const data = await fetchJSON(ITEMS_URL);
      state = loadState();
      // merge defaults for stats if missing
      state.stats = Object.assign({
        health:100, maxHealth:100,
        stamina:100, maxStamina:100,
        hunger:0, thirst:0
      }, state.stats);
      saveState(state);
      renderStats(state.stats);
      renderInventory(data.gameInventoryDetails || [], state);
    } catch(e) {
      document.getElementById('inventory-grid').innerHTML =
        `<div class="error">Error loading inventory:<br>${e.message}</div>`;
    }
  }

  // Kick off immediately
  init();
})();

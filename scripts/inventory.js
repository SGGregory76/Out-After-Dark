// Updated Inventory Script: uses detailed inventory.json definitions
(async function(){
  const INV_JSON_URL = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/inventory.json';
  const INV_KEY      = 'gameInventory';
  const CASH_KEY     = 'gameCash';

  // Fetch helper
  async function fetchJSON(url) {
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
  }

  // Seed from inventory.json if no saved data
  async function seedInventory() {
    if (!localStorage.getItem(INV_KEY)) {
      try {
        const data = await fetchJSON(INV_JSON_URL);
        // Initialize inventory quantities & cash
        const invObj = {};
        data.inventory.forEach(item => invObj[item.id] = item.quantity);
        localStorage.setItem(INV_KEY, JSON.stringify(invObj));
        localStorage.setItem(CASH_KEY, String(data.gameCash || 0));
        console.log('Inventory seeded');
      } catch(e) {
        console.error('Seed failed:', e);
      }
    }
  }

  // Load state
  function loadState() {
    return {
      inv: JSON.parse(localStorage.getItem(INV_KEY) || '{}'),
      cash: parseInt(localStorage.getItem(CASH_KEY) || '0', 10)
    };
  }
  function saveState(state) {
    localStorage.setItem(INV_KEY, JSON.stringify(state.inv));
    localStorage.setItem(CASH_KEY, state.cash);
  }

  // Render cash
  function renderStats(state) {
    const el = document.getElementById('stat-cash');
    if (el) el.textContent = `💵 $${state.cash}`;
  }

  // Apply usable effect
  function applyEffect(itemDef) {
    const eff = itemDef.usable;
    if (!eff) return;
    let msg = '';
    if (eff.thirstRegen) msg += `Thirst -${eff.thirstRegen}. `;
    if (eff.hungerRegen) msg += `Hunger -${eff.hungerRegen}. `;
    if (eff.healAmount) msg += `Health +${eff.healAmount}. `;
    if (eff.effect === 'euphoria') {
      msg += `Euphoria for ${eff.durationMinutes}min: +${eff.staminaRegen} stamina/min, +${eff.stealthBonus}% stealth. `;
      msg += `Side: +${eff.sideEffect.hungerIncrease} hunger, +${eff.sideEffect.thirstIncrease} thirst.`;
    }
    alert(msg || 'Effect applied.');
  }

  // Render inventory grid
  function renderInventory(defs, state) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    defs.inventory.forEach(item => {
      const qty = state.inv[item.id] || 0;
      if (qty <= 0) return;
      const card = document.createElement('div');
      card.className = 'inventory-card';
      card.innerHTML = `
        <div class="icon">${item.icon}</div>
        <div class="name">${item.name}</div>
        <div class="qty">x${qty}</div>
        <button class="use-btn">Use</button>
        ${item.sellable ? `<button class="sell-btn">Sell $${item.unitValue}</button>` : ''}
        <button class="discard-btn">Discard</button>
      `;
      // Handlers
      card.querySelector('.use-btn').onclick = () => {
        if (item.usable) applyEffect(item);
        updateQty(item.id, -1);
      };
      if (item.sellable) card.querySelector('.sell-btn').onclick = () => {
        state.cash += item.unitValue;
        document.getElementById('stat-cash').textContent = `💵 $${state.cash}`;
        updateQty(item.id, -1);
      };
      card.querySelector('.discard-btn').onclick = () => updateQty(item.id, -1);
      grid.appendChild(card);
    });
    if (!grid.querySelector('.inventory-card')) {
      grid.innerHTML = '<div class="error">No items in inventory.</div>';
    }
  }

  // Update quantity & re-render
  function updateQty(id, delta) {
    const state = loadState();
    state.inv[id] = Math.max(0, (state.inv[id]||0) + delta);
    saveState(state);
    renderStats(state);
    fetchJSON(INV_JSON_URL).then(defs => renderInventory(defs, state));
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', async ()=>{
    if (!document.getElementById('inventory-grid')) return;
    await seedInventory();
    const state = loadState();
    renderStats(state);
    try {
      const defs = await fetchJSON(INV_JSON_URL);
      renderInventory(defs, state);
    } catch(e) {
      document.getElementById('inventory-grid').innerHTML =
        `<div class="error">Error loading definitions:<br>${e.message}</div>`;
    }
  });
})();

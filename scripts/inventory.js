(function(){
  // Inventory module
  const PRODUCTS_URL =
    'https://raw.githubusercontent.com/SGGregory76/Out-After-Dark/main/data/products.json'
    + '?t=' + Date.now();
  const CASH_KEY = 'gameCash';
  const INV_KEY  = 'gameInventory';

  async function loadProducts() {
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  function loadState() {
    const cash = parseInt(localStorage.getItem(CASH_KEY) || '0', 10);
    const inv = JSON.parse(localStorage.getItem(INV_KEY) || '{}');
    return { cash, inv };
  }

  function saveState(state) {
    localStorage.setItem(CASH_KEY, state.cash);
    localStorage.setItem(INV_KEY, JSON.stringify(state.inv));
  }

  function createCard(p, state, onUpdate) {
    const qty = state.inv[p.id] || 0;
    const card = document.createElement('div');
    card.className = 'inventory-card';
    card.innerHTML = `
      <div class="icon">${p.emoji}</div>
      <div class="name">${p.name}</div>
      <div class="qty">x${qty}</div>
      <button data-action="use" ${qty<=0?'disabled':''}>Use</button>
      <button data-action="sell" ${qty<=0?'disabled':''}>Sell $${p.basePrice}</button>
      <button data-action="discard" ${qty<=0?'disabled':''}>Discard</button>
    `;
    card.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (qty <= 0) return;
        if (action === 'use') {
          state.inv[p.id]--;
        } else if (action === 'sell') {
          state.inv[p.id]--;
          state.cash += p.basePrice;
        } else if (action === 'discard') {
          state.inv[p.id]--;
        }
        saveState(state);
        onUpdate();
      });
    });
    return card;
  }

  function renderGrid(products, state) {
    const grid = document.getElementById('inventory-grid');
    const cashEl = document.getElementById('stat-cash');
    cashEl.textContent = state.cash;
    grid.innerHTML = '';

    products.forEach(p => {
      if (state.inv[p.id] == null) state.inv[p.id] = 0;
      const card = createCard(p, state, () => renderGrid(products, state));
      grid.appendChild(card);
    });
  }

  window.Inventory = {
    init: async function() {
      try {
        const products = await loadProducts();
        const state = loadState();
        renderGrid(products, state);
      } catch (err) {
        document.getElementById('inventory-grid').innerHTML =
          `<div class="loading" style="color:#f66;">Error: ${err.message}</div>`;
      }
    }
  };

  // Auto init on page load if element exists
  window.addEventListener('load', () => {
    if (document.getElementById('inventory-grid')) {
      Inventory.init();
    }
  });
})();


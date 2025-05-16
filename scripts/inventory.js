(async function(){
  // Unified Inventory Script using items.json
  const ITEMS_URL = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/items.json';
  const INV_KEY   = 'gameInventory';
  const CASH_KEY  = 'gameCash';

  // Load JSON helper
  async function fetchJSON(url){
    const res = await fetch(url + '?t='+Date.now());
    if(!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
  }

  // State helpers
  function loadState(){
    const inv = JSON.parse(localStorage.getItem(INV_KEY) || '{}');
    const cash= parseInt(localStorage.getItem(CASH_KEY)||'0',10);
    return { inv, cash };
  }
  function saveState({inv, cash}){
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
    localStorage.setItem(CASH_KEY, cash);
  }

  // Render stats bar
  function renderStats(state){
    document.getElementById('stat-cash').textContent = `💵 $${state.cash}`;
  }

  // Render inventory
  function renderInventory(items, state){
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    items.forEach(item => {
      const qty = state.inv[item.id]||0;
      if(qty <= 0) return; // skip zero quantity
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
      const buttons = card.querySelectorAll('button');
      buttons.forEach(btn => btn.disabled = qty<=0);
      buttons[0].onclick = () => {
        // handle use
        if(item.uses.includes('use')){
          // e.g., apply heal or effect
        }
        updateItem(item.id, -1);
      };
      buttons[1].onclick = () => {
        // sell
        state.cash += item.baseValue;
        updateItem(item.id, -1);
      };
      buttons[2].onclick = () => updateItem(item.id, -1);
      grid.appendChild(card);
    });
  }

  function updateItem(id, delta){
    const state = loadState();
    state.inv[id] = Math.max(0, (state.inv[id]||0) + delta);
    saveState(state);
    init();
  }

  // Initialization
  async function init(){
    try {
      const itemsData = await fetchJSON(ITEMS_URL);
      const state = loadState();
      renderStats(state);
      // filter items that have 'use' or 'sell' or 'discard'
      renderInventory(itemsData, state);
    } catch(e) {
      document.getElementById('inventory-grid').innerHTML =
        `<div class="error">Error: ${e.message}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    if(!document.getElementById('inventory-grid')) return;
    init();
  });
})();

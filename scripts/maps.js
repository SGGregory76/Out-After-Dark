<script>
(async function(){
  const MAPS_URL  = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/maps.json';
  const STATS_KEY = 'gameStats';
  const CASH_KEY  = 'gameCash';

  // Helpers
  async function fetchJSON(url){
    const r = await fetch(url + '?t=' + Date.now());
    if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
    return r.json();
  }
  function loadStats(){
    try {
      return JSON.parse(localStorage.getItem(STATS_KEY))||{};
    } catch { return {}; }
  }
  function saveStats(stats){
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
  function loadCash(){
    return parseInt(localStorage.getItem(CASH_KEY)||'0',10);
  }
  function saveCash(cash){
    localStorage.setItem(CASH_KEY, cash);
    window.dispatchEvent(new CustomEvent('statsUpdated', { detail: loadStats() }));
  }
  function meetsRequirements(req, stats){
    if ((stats.level||0) < (req.level||0)) return false;
    if ((stats.rep||0)   < (req.rep||0))   return false;
    return true;
  }

  // Render maps
  const container = document.getElementById('maps-container');
  if (!container) return;

  try {
    const maps = await fetchJSON(MAPS_URL);
    const stats = loadStats();
    let cash    = loadCash();

    container.innerHTML = '';
    maps.forEach(m => {
      const canEnter = meetsRequirements(m.requirements, stats) && cash >= (m.accessCost||0);
      // build loot text
      const lootText = m.itemsFound.map(x=>`${x.chance*100}% ${x.id} x${x.quantity}`).join('<br>');
      // build rewards text
      const rew = m.rewards;
      const rewText = `EXP: ${rew.exp}, $${rew.cash}, Heat:+${rew.heat}, Rep:+${rew.rep}`;
      // build effects text
      const eff = m.effects;
      const effText = `Hunger+${eff.hungerIncrease}, Thirst+${eff.thirstIncrease}`;
      // card
      const card = document.createElement('div');
      card.className = `map-card ${canEnter?'':'locked'}`;
      card.innerHTML = `
        <div class="map-icon">${m.icon}</div>
        <h3 class="map-name">${m.name}</h3>
        <p class="map-desc">${m.description}</p>
        <p class="map-meta">Cost: $${m.accessCost} • Requires L${m.requirements.level}, Rep${m.requirements.rep}</p>
        <p class="map-meta">Rewards: ${rewText}</p>
        <p class="map-meta">Loot: <br>${lootText}</p>
        <p class="map-meta">Effect: ${effText}</p>
        <button ${canEnter?'':'disabled'} data-id="${m.id}">${canEnter?'Enter':'Locked'}</button>
      `;
      // click handler
      card.querySelector('button').addEventListener('click', () => {
        // deduct cost
        cash -= m.accessCost;
        saveCash(cash);
        // navigate (swap for iframe.src if using iframe)
        window.location.href = `/p/map_${m.id}.html`;
      });
      container.appendChild(card);
    });
  } catch(e){
    container.innerHTML = `<div class="error">Error loading maps:<br>${e.message}</div>`;
  }
})();
</script>

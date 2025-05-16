(function(){
  // Missions module with items integration
  const MISSIONS_URL = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/missions.json';
  const ITEMS_URL    = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/items.json';
  const STATS_KEY    = 'gameStats';
  const MISSION_KEY  = 'gameMissions';

  async function fetchJSON(url) {
    const res = await fetch(url + '?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
    return res.json();
  }

  function loadStats() {
    const s = localStorage.getItem(STATS_KEY);
    return s ? JSON.parse(s) : {};
  }

  function loadInventory() {
    try { return JSON.parse(localStorage.getItem('gameInventory'))||{}; }
    catch { return {}; }
  }

  function loadMissionState() {
    const m = localStorage.getItem(MISSION_KEY);
    return m ? JSON.parse(m) : {};
  }
  function saveMissionState(state) {
    localStorage.setItem(MISSION_KEY, JSON.stringify(state));
  }

  function checkRequirements(req, stats, inv) {
    if ((stats.rep||0) < (req.rep||0)) return false;
    for (let id in (req.items||{})) {
      if ((inv[id]||0) < req.items[id]) return false;
    }
    return true;
  }

  function renderMissions(missions, items) {
    const container = document.getElementById('missions-container');
    container.innerHTML = '';
    const stats = loadStats();
    const inv   = loadInventory();
    const state = loadMissionState();

    missions.forEach(m => {
      let status = state[m.id] || 'locked';
      if (status==='locked' && checkRequirements(m.requirements, stats, inv)) {
        status = 'available';
      }

      // build requirement text
      const reqText = [];
      if (m.requirements.rep) reqText.push(`Rep ≥ ${m.requirements.rep}`);
      for (let id in (m.requirements.items||{})) {
        const def=items[id]||{};
        reqText.push(`${def.icon||''} ${def.name||id} x${m.requirements.items[id]}`);
      }

      const card = document.createElement('div');
      card.className = `mission-card ${status}`;
      card.innerHTML = `
        <h3>${m.title}</h3>
        <p>${m.description}</p>
        <p><strong>Req:</strong> ${reqText.join(', ')||'None'}</p>
        <p class="status-line">Status: ${status}</p>
        <button ${status!=='available'?'disabled':''} data-id="${m.id}">Start</button>
      `;
      card.querySelector('button').onclick = () => startMission(m.id, missions, items);
      container.appendChild(card);
    });
  }

  function startMission(id, missions, items) {
    const s = loadMissionState();
    s[id] = 'inProgress';
    saveMissionState(s);
    renderMissions(missions, items);
    // optionally open mission detail modal
    alert(`Mission ' ${missions.find(m=>m.id===id).title} ' started!`);
  }

  async function init() {
    try {
      const [missions, items] = await Promise.all([fetchJSON(MISSIONS_URL), fetchJSON(ITEMS_URL)]);
      renderMissions(missions, Object.fromEntries(items.map(i=>[i.id,i])));
    } catch(err) {
      const c = document.getElementById('missions-container');
      if (c) c.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    if (document.getElementById('missions-container')) init();
  });
})();

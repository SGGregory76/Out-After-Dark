(function(){
  // Missions module
  const MISSIONS_URL =
    'https://raw.githubusercontent.com/SGGregory76/Out-After-Dark/main/data/missions.json'
    + '?t=' + Date.now();
  const STATS_KEY = 'gameStats';
  const MISSION_STATE_KEY = 'gameMissions';

  async function loadMissions() {
    const res = await fetch(MISSIONS_URL);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  function loadStats() {
    const s = localStorage.getItem(STATS_KEY);
    return s ? JSON.parse(s) : {};
  }

  function saveMissionState(state) {
    localStorage.setItem(MISSION_STATE_KEY, JSON.stringify(state));
  }
  function loadMissionState() {
    const m = localStorage.getItem(MISSION_STATE_KEY);
    return m ? JSON.parse(m) : {};
  }

  function checkRequirements(req, stats, inventory) {
    if ((stats.rep || 0) < (req.rep || 0)) return false;
    for (let item in (req.items||{})) {
      if ((inventory[item]||0) < req.items[item]) return false;
    }
    return true;
  }

  function renderMissions(missions) {
    const container = document.getElementById('missions-container');
    container.innerHTML = '';
    const stats = loadStats();
    const inv = JSON.parse(localStorage.getItem('gameInventory')||'{}');
    const mState = loadMissionState();

    missions.forEach(m => {
      const state = mState[m.id] || 'locked';
      let status = state;
      if (state === 'locked' && checkRequirements(m.requirements, stats, inv)) {
        status = 'available';
      }
      const card = document.createElement('div');
      card.className = 'mission-card ' + status;
      card.innerHTML = `
        <h3>${m.title}</h3>
        <p>${m.description}</p>
        <p>Status: ${status}</p>
        <button ${status!=='available'?'disabled':''} data-id="${m.id}">Start</button>
      `;
      card.querySelector('button').onclick = () => startMission(m);
      container.appendChild(card);
    });
  }

  function startMission(mission) {
    const mState = loadMissionState();
    mState[mission.id] = 'inProgress';
    saveMissionState(mState);
    renderMissions(_MISSIONS);
    // Here you could navigate flow or open mission modal
    alert(`Mission '${mission.title}' started.`);
  }

  let _MISSIONS = [];
  document.addEventListener('DOMContentLoaded', async ()=>{
    const cont = document.getElementById('missions-container');
    if (!cont) return;
    try {
      _MISSIONS = await loadMissions();
      renderMissions(_MISSIONS);
    } catch(err) {
      cont.innerHTML = `<div class="error">Error loading missions:<br>${err.message}</div>`;
    }
  });
})();

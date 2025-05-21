// stats-tick.js
(async function(){
  const STATS_KEY = 'gameStats';
  const STATS_JSON_URL = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/stats.json';
  let config;

  // Load JSON config (defaults, inventory choices, puzzles)
  async function loadConfig() {
    if (config) return;
    const res = await fetch(STATS_JSON_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    config = await res.json();
  }

  // Initialize stats in localStorage
  async function initStats() {
    await loadConfig();
    const stored = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
    // Only pick defined keys
    const stats = {};
    for (let key in config.defaultStats) {
      stats[key] = stored[key] !== undefined ? stored[key] : config.defaultStats[key];
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // Save stats
  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // Load current stats
  async function loadStats() {
    await initStats();
    return JSON.parse(localStorage.getItem(STATS_KEY));
  }

  // Apply delta to stats and save
  async function applyDelta(delta) {
    const stats = await loadStats();
    for (let k in delta) {
      if (stats[k] !== undefined) {
        stats[k] += delta[k];
      }
    }
    saveStats(stats);
    return stats;
  }

  // Render stats in DOM
  function renderStats(stats) {
    const icons = {
      health: '❤',
      energy: '⚡',
      cash: '💵',
      rep: '🤝',
      xp: '⭐',
      heat: '🔥'
    };
    for (let key in icons) {
      const el = document.getElementById(`stat-${key}`) || document.getElementById(`hub-${key}`);
      if (el && stats[key] !== undefined) {
        const maxKey = key === 'health' ? 'maxHealth' : key === 'energy' ? 'maxEnergy' : null;
        if (maxKey) {
          el.textContent = `${icons[key]} ${stats[key]}/${stats[maxKey]}`;
        } else {
          el.textContent = `${icons[key]} ${stats[key]}`;
        }
      }
    }
  }

  // Inventory choice handler
  function renderInventory(choices, containerId, callback) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.textContent = c.label;
      btn.onclick = async () => {
        await applyDelta(c.delta);
        callback();
      };
      container.appendChild(btn);
    });
  }

  // Puzzle runner
  async function runSearchPuzzle(puzzle, containerId, callback) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    let clicks = 0;
    const grid = document.createElement('div');
    grid.className = 'search-grid';
    grid.style.setProperty('--cols', puzzle.gridSize);
    const info = document.createElement('div');
    const countSpan = document.createElement('span');
    countSpan.textContent = '0';
    info.innerHTML = `Clicks: `;
    info.appendChild(countSpan);
    info.innerHTML += `/${puzzle.maxClicks}`;
    container.append(puzzle.prompt, grid, info);
    for (let r = 1; r <= puzzle.gridSize; r++) {
      for (let c = 1; c <= puzzle.gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'search-cell';
        cell.onclick = async () => {
          if (clicks >= puzzle.maxClicks) return;
          clicks++;
          countSpan.textContent = clicks;
          if (r === puzzle.stashPosition.row && c === puzzle.stashPosition.col) {
            cell.classList.add('found');
            await applyDelta(puzzle.delta);
            callback();
          } else if (clicks >= puzzle.maxClicks) {
            callback();
          }
        };
        grid.appendChild(cell);
      }
    }
  }

  // Combat runner (placeholder for your combat logic)
  async function runCombat(callback) {
    // ... implement combat, then:
    const reward = { xp: 5, cash: 50 };
    await applyDelta(reward);
    callback();
  }

  // Public API
  window.GameEngine = {
    init: async () => {
      const stats = await loadStats();
      renderStats(stats);
    },
    applyDelta,
    renderStats,
    renderInventory: choicesKey => renderInventory(config.inventoryChoices[choicesKey], 'game-container', async () => window.dispatchEvent(new Event('nextStep'))),
    runSearchPuzzle: async () => runSearchPuzzle(config.puzzles.find(p=>p.id==='puzzle-search'), 'game-container', async () => window.dispatchEvent(new Event('nextStep'))),
    runSecondPuzzle: async () => runSearchPuzzle(config.puzzles.find(p=>p.id==='puzzle-2'), 'game-container', async () => window.dispatchEvent(new Event('nextStep'))),
    runCombat: async () => runCombat(async () => window.dispatchEvent(new Event('nextStep')))
  };

  // Auto-initialize
  document.addEventListener('DOMContentLoaded', window.GameEngine.init);
})();

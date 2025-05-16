(function(){
  // Crafting module
  const CRAFT_URL =
    'https://raw.githubusercontent.com/SGGregory76/Out-After-Dark/main/data/crafting.json'
    + '?t=' + Date.now();
  const INV_KEY   = 'gameInventory';
  const CRAFT_KEY = 'gameCraftJobs';  // track in-progress jobs

  async function loadRecipes() {
    const res = await fetch(CRAFT_URL);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  function loadInventory() {
    return JSON.parse(localStorage.getItem(INV_KEY) || '{}');
  }

  function saveInventory(inv) {
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
  }

  function loadJobs() {
    return JSON.parse(localStorage.getItem(CRAFT_KEY) || '[]');
  }

  function saveJobs(jobs) {
    localStorage.setItem(CRAFT_KEY, JSON.stringify(jobs));
  }

  function createCard(r, inv, onStart) {
    const canCraft = Object.entries(r.ingredients).every(
      ([id, qty]) => (inv[id] || 0) >= qty
    );
    const card = document.createElement('div');
    card.className = 'craft-card';
    card.innerHTML = `
      <div class="icon">${r.icon}</div>
      <div class="name">${r.name}</div>
      <div class="desc">${r.description}</div>
      <div class="ing">${Object.entries(r.ingredients)
        .map(([id,qty])=>`${id}×${qty}`).join(', ')}</div>
      <div class="btn-wrap">
        <button ${!canCraft?'disabled':''} data-id="${r.id}">Craft</button>
      </div>
    `;
    const btn = card.querySelector('button');
    btn.addEventListener('click', () => onStart(r));
    return card;
  }

  function render(recipes, inv, jobs) {
    const grid = document.getElementById('craft-grid');
    grid.innerHTML = '';
    recipes.forEach(r => {
      grid.appendChild(createCard(r, inv, startCraft));
    });
    renderJobs(jobs);
  }

  function renderJobs(jobs) {
    const list = document.getElementById('craft-jobs');
    if (!list) return;
    list.innerHTML = '';
    jobs.forEach(job => {
      const li = document.createElement('li');
      li.textContent = `${job.name}: ${job.status}`;
      list.appendChild(li);
    });
  }

  function startCraft(recipe) {
    const inv = loadInventory();
    // Deduct ingredients
    Object.entries(recipe.ingredients).forEach(([id,qty]) => {
      inv[id] = (inv[id]||0) - qty;
    });
    saveInventory(inv);
    // Schedule job
    const jobs = loadJobs();
    const end = Date.now() + recipe.timeMinutes * 60000;
    jobs.push({ id: recipe.id, name: recipe.name, endTime: end, status: 'In progress' });
    saveJobs(jobs);
    update();
  }

  function update() {
    const now = Date.now();
    const recipes = window._craftingRecipes || [];
    const inv     = loadInventory();
    let jobs      = loadJobs();
    jobs = jobs.map(job => {
      if (job.status === 'In progress' && now >= job.endTime) {
        // complete
        const recipe = recipes.find(r => r.id === job.id);
        // Failure check
        if (Math.random() < recipe.failureRate) {
          job.status = 'Failed';
        } else {
          // add product
          inv[Object.keys(recipe.produces)[0]] =
            (inv[Object.keys(recipe.produces)[0]]||0) + Object.values(recipe.produces)[0];
          saveInventory(inv);
          job.status = 'Complete';
        }
      }
      return job;
    });
    saveJobs(jobs);
    render(recipes, inv, jobs);
  }

  async function init() {
    try {
      const recipes = await loadRecipes();
      window._craftingRecipes = recipes;
      const inv = loadInventory();
      const jobs = loadJobs();
      // Render grid and jobs
      render(recipes, inv, jobs);
      // Poll for job completion
      setInterval(update, 5000);
    } catch(err) {
      document.getElementById('craft-container').innerHTML =
        `<div class="error">Error loading crafting: ${err.message}</div>`;
    }
  }

  window.Crafting = { init };
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('craft-container')) {
      init();
    }
  });
})();

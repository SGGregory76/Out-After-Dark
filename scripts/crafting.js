(async function(){
  // Master crafting script: loads item definitions and recipes
  const ITEMS_URL    = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/items.json';
  const CRAFT_URL    = 'https://cdn.jsdelivr.net/gh/SGGregory76/Out-After-Dark@main/data/crafting.json';
  const INV_KEY      = 'gameInventory';
  const JOBS_KEY     = 'gameCraftJobs';

  // Load JSON helper
  async function fetchJSON(url){
    const r = await fetch(url + '?t='+Date.now());
    if(!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
    return r.json();
  }

  // Inventory helpers
  function loadInventory(){
    try {return JSON.parse(localStorage.getItem(INV_KEY))||{}} catch{return{}};
  }
  function saveInventory(inv){
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
  }

  // Job state helpers
  function loadJobs(){
    try{return JSON.parse(localStorage.getItem(JOBS_KEY))||[]}catch{return[]};
  }
  function saveJobs(jobs){
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  }

  // Main render functions
  let ITEMS = {}, RECIPES = [];

  function renderRecipes(){
    const inv = loadInventory();
    const grid = document.getElementById('craft-grid');
    grid.innerHTML = '';
    RECIPES.forEach(r=>{
      // check ingredients
      const can = Object.entries(r.ingredients).every(([id,qty])=> (inv[id]||0)>=qty);
      // build card
      const card = document.createElement('div'); card.className='craft-card';
      const icon = ITEMS[r.id]?.icon||'❓';
      const name = ITEMS[r.id]?.name||r.id;
      const desc = ITEMS[r.id]?.description||'';
      const ingText = Object.entries(r.ingredients).map(([id,qty])=>`${ITEMS[id]?.icon||''} ${ITEMS[id]?.name||id} x${qty}`).join(', ');
      card.innerHTML = `
        <div class="icon">${icon}</div>
        <div class="name">${name}</div>
        <div class="desc">${desc}</div>
        <div class="ing">Need: ${ingText}</div>
        <div class="btn-wrap">
          <button ${!can?'disabled':''} data-id="${r.id}">Craft</button>
        </div>
      `;
      card.querySelector('button').onclick = ()=>startJob(r);
      grid.appendChild(card);
    });
  }

  function renderJobs(){
    const now = Date.now();
    const list = document.getElementById('craft-jobs'); list.innerHTML='';
    const jobs = loadJobs();
    const inv  = loadInventory();
    jobs.forEach(job=>{
      const r = RECIPES.find(x=>x.id===job.id);
      let status=job.status;
      if(status==='In progress' && now>=job.end){
        status = Math.random()<r.failureRate?'Failed':'Complete';
        if(status==='Complete'){
          const [outId,outQty]=Object.entries(r.produces)[0];
          inv[outId]=(inv[outId]||0)+outQty;
          saveInventory(inv);
        }
        job.status=status;
      }
      list.innerHTML+=`<li>${ITEMS[job.id]?.icon||''} ${ITEMS[job.id]?.name||job.id}: ${status}</li>`;
    });
    saveJobs(jobs);
  }

  function startJob(r){
    const inv = loadInventory();
    Object.entries(r.ingredients).forEach(([id,qty])=>inv[id]=(inv[id]||0)-qty);
    saveInventory(inv);
    const jobs = loadJobs();
    jobs.push({ id:r.id, end:Date.now()+r.timeMinutes*60000, status:'In progress'});
    saveJobs(jobs);
    renderRecipes(); renderJobs();
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', async()=>{
    if(!document.getElementById('craft-grid')) return;
    try{
      const [itemsData, craftData] = await Promise.all([
        fetchJSON(ITEMS_URL),
        fetchJSON(CRAFT_URL)
      ]);
      // build items map
      ITEMS = Object.fromEntries(itemsData.map(i=>[i.id,i]));
      RECIPES = craftData.recipes;
      // initial render
      renderRecipes(); renderJobs();
      setInterval(renderJobs,5000);
    }catch(e){
      document.getElementById('craft-grid').innerHTML=`<div class="error">${e.message}</div>`;
    }
  });
})();

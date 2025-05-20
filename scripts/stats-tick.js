(async function(){
  const KEY='gameStats', URL='/data/stats.json'; let defaults;
  async function loadDefs(){ if(defaults)return; defaults= (await (await fetch(URL)).json()).defaultStats; }
  async function loadStats(){ await loadDefs(); const raw=localStorage.getItem(KEY);
    try{ const j=JSON.parse(raw||'{}'); return {...defaults, ...j}; }catch{ return {...defaults}; }
  }
  function save(s){ localStorage.setItem(KEY,JSON.stringify(s)); }
  function render(s){ Object.entries(s).forEach(([k,v])=>{
      const e=document.getElementById('hub-'+k); if(e){ e.textContent=v; }
    });
  }
  window.StatsTick={ init:async()=>{ const s=await loadStats(); render(s); }, loadStats, save, render };
  document.addEventListener('DOMContentLoaded',()=>StatsTick.init());
})();

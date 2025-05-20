export async function loadPuzzles(){ return (await fetch('/data/puzzles.json')).json(); }
export function renderPuzzle(p, onOK, onFail){
  const c=document.getElementById('dialogue-content');
  if(p.type==='search') return renderSearch(p,c,onOK,onFail);
  // riddle & code handlers...
}
function renderSearch(p, container, onOK, onFail){
  let clicks=0; const {gridSize, maxClicks, stashPosition}=p;
  container.innerHTML=`<p>${p.prompt}</p>
    <div id="grid" class="search-grid" style="--cols:${gridSize}"></div>
    <p>Clicks: <span id="cnt">0</span>/${maxClicks}</p>`;
  const grid=container.querySelector('#grid');
  for(let r=1;r<=gridSize;r++){ for(let c=1;c<=gridSize;c++){
    const cell=document.createElement('div'); cell.className='search-cell';
    cell.onclick=()=>{
      clicks++; container.querySelector('#cnt').textContent=clicks;
      if(r===stashPosition.row&&c===stashPosition.col){ cell.classList.add('found'); onOK(p.weight); }
      else if(clicks>=maxClicks) onFail({heat:1});
    };
    grid.append(cell);
  }}
}

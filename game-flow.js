import { loadStats, saveStats } from './stats-tick.js';
import { loadPuzzles, renderPuzzle } from './puzzles.js';
(async()=>{
  const stats=await loadStats(); const puzzles=await loadPuzzles(); let step=0;
  const next=()=>{
    switch(step){
      case 0: showDialogue('…intro…', next); break;
      case 1: renderPuzzle(puzzles[0], ok,next); break;
      case 2: renderPuzzle(puzzles[2], ok,next); break; // search
      case 3: startCombat(()=>{ok({});}); break;
      case 4: renderPuzzle(puzzles[1], ok, next); break;
      default: window.location='/pages/burner-os.html';
    }
    step++;
  };
  function ok(delta){ Object.assign(stats,delta); saveStats(stats); next(); }
  next();
})();

'use strict';
const E=require('../../engine.js');
const fs=require('node:fs');
const path=require('node:path');

function recordTraces(E, gamesCsv){
 const directions=['up','left','right','down'];
 const lines=gamesCsv.trim().split('\n').slice(1);
 const output=['pattern,seed,changed_flags'];
 for(const line of lines){
  const [pattern,seed,score,maxTile,moves,attempts,invalid,won]=line.split(',');
  const rng=E.seededRng(Number(seed));let state=E.createGame(rng),flags='';
  while(!state.over){
   if(flags.length>=1000000)throw Error('Unexpected run limit');
   const next=E.step(state,directions[Number(pattern[flags.length%4])],rng);
   flags+=next===state?'0':'1';state=next;
  }
  if(flags.length!==Number(attempts)||state.moves!==Number(moves)||flags.length-state.moves!==Number(invalid)||state.score!==Number(score)||E.maxTile(state.board)!==Number(maxTile)||Number(state.won)!==Number(won))throw Error('Replay mismatch '+pattern+' '+seed);
  output.push(pattern+','+seed+','+flags);
 }
 return output.join('\n')+'\n';
}

const games=fs.readFileSync(path.join(__dirname,'games.csv'),'utf8');
fs.writeFileSync(path.join(__dirname,'step-traces.csv'),recordTraces(E,games));
console.log('All recorded games replayed and verified.');

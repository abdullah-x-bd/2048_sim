'use strict';
const E=require('../../engine.js');
const fs=require('node:fs');
const path=require('node:path');

function permutations(xs){return xs.length===0?[[]]:xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(p=>[x,...p]));}

function runExperiment(E,seeds){
 const directions=['up','left','right','down'],rows=[];
 for(const digits of permutations([0,1,2,3])){
  const pattern=digits.join('');
  for(const seed of seeds){
   const rng=E.seededRng(seed);let state=E.createGame(rng),attempts=0;
   while(!state.over){
    if(attempts>=1000000)throw Error('Unexpected run limit: '+pattern+' seed '+seed);
    state=E.step(state,directions[digits[attempts%4]],rng);attempts++;
   }
   rows.push({pattern,seed,score:state.score,max_tile:E.maxTile(state.board),valid_moves:state.moves,attempts,invalid_moves:attempts-state.moves,won:state.won?1:0});
  }
 }
 return rows;
}

function summarize(rows){
 const avg=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
 const med=xs=>{const s=xs.slice().sort((a,b)=>a-b),n=s.length;return (s[Math.floor((n-1)/2)]+s[Math.floor(n/2)])/2;};
 const sd=xs=>Math.sqrt(xs.reduce((a,b)=>a+(b-avg(xs))**2,0)/(xs.length-1));
 const groups=[...new Set(rows.map(x=>x.pattern))];
 return groups.map(pattern=>{
  const g=rows.filter(x=>x.pattern===pattern),n=g.length,s=g.map(x=>x.score),t=g.map(x=>x.max_tile),m=g.map(x=>x.valid_moves),a=g.map(x=>x.attempts),d=sd(s),mean=avg(s);
  return {pattern,n,mean_score:mean,median_score:med(s),sd_score:d,ci95_low:mean-1.984217*d/Math.sqrt(n),ci95_high:mean+1.984217*d/Math.sqrt(n),best_score:Math.max(...s),mean_max_tile:avg(t),median_max_tile:med(t),best_tile:Math.max(...t),mean_moves:avg(m),mean_attempts:avg(a),invalid_pct:100*g.reduce((a,x)=>a+x.invalid_moves,0)/a.reduce((a,b)=>a+b,0),reach_128:t.filter(x=>x>=128).length,reach_256:t.filter(x=>x>=256).length,reach_512:t.filter(x=>x>=512).length,reach_1024:t.filter(x=>x>=1024).length,reach_2048:t.filter(x=>x>=2048).length};
 }).sort((a,b)=>b.mean_score-a.mean_score||a.pattern.localeCompare(b.pattern));
}

function csv(rows){const keys=Object.keys(rows[0]);return keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n';}

const seeds=Array.from({length:100},(_,i)=>i);
const rows=runExperiment(E,seeds),summary=summarize(rows);
for(const [name,data] of [['games.csv',rows],['summary.csv',summary]])fs.writeFileSync(path.join(__dirname,name),csv(data));
console.table(summary);

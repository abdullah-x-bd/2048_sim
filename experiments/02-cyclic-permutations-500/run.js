'use strict';
const E=require('../../engine.js');
const fs=require('node:fs');
const path=require('node:path');

function permutations(xs){return xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];}

function run(E,seeds,patterns){
 const dirs=['up','left','right','down'],rows=[],traces=[];
 for(const pattern of patterns)for(const seed of seeds){
  const rng=E.seededRng(seed);let state=E.createGame(rng),flags='';
  while(!state.over){
   if(flags.length>=1000000)throw Error('Unexpected limit '+pattern+' '+seed);
   const next=E.step(state,dirs[Number(pattern[flags.length%4])],rng);
   flags+=next===state?'0':'1';state=next;
  }
  const valid=flags.split('1').length-1;
  if(valid!==state.moves)throw Error('Trace mismatch');
  rows.push({pattern,seed,score:state.score,max_tile:E.maxTile(state.board),valid_moves:valid,attempts:flags.length,invalid_moves:flags.length-valid,won:Number(state.won)});
  traces.push({pattern,seed,changed_flags:flags});
 }
 return {rows,traces};
}

function csv(rows){const k=Object.keys(rows[0]);return k.join(',')+'\n'+rows.map(r=>k.map(x=>r[x]).join(',')).join('\n')+'\n';}

function parse(s){return s.trim().split('\n').slice(1).map(l=>{const [pattern,...v]=l.split(',');const [seed,score,max_tile,valid_moves,attempts,invalid_moves,won]=v.map(Number);return {pattern,seed,score,max_tile,valid_moves,attempts,invalid_moves,won};});}

function mean(a){return a.reduce((s,v)=>s+v,0)/a.length;}

function sd(a){const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));}

function stats(g){
 const s=g.map(r=>r.score),t=g.map(r=>r.max_tile),n=g.length,avg=mean(s),std=sd(s),critical=n===500?1.964729:n===600?1.963933:1.984217;
 const sorted=s.slice().sort((a,b)=>a-b);
 return {n,mean_score:avg,median_score:(sorted[Math.floor((n-1)/2)]+sorted[Math.floor(n/2)])/2,sd_score:std,ci95_low:avg-critical*std/Math.sqrt(n),ci95_high:avg+critical*std/Math.sqrt(n),best_score:Math.max(...s),best_tile:Math.max(...t),mean_valid_moves:mean(g.map(r=>r.valid_moves)),mean_attempts:mean(g.map(r=>r.attempts)),invalid_moves:g.reduce((s,r)=>s+r.invalid_moves,0),reach_256:t.filter(v=>v>=256).length,reach_512:t.filter(v=>v>=512).length,reach_1024:t.filter(v=>v>=1024).length,reach_2048:t.filter(v=>v>=2048).length};
}

function summary(rows,patterns){return patterns.map(pattern=>({pattern,...stats(rows.filter(r=>r.pattern===pattern))})).sort((a,b)=>b.mean_score-a.mean_score||a.pattern.localeCompare(b.pattern));}

function circular(p){const axis=d=>d==='0'||d==='3';return [...p].every((d,i)=>axis(d)!==axis(p[(i+1)%4]));}

function compare(rows){
 const a=rows.filter(r=>circular(r.pattern)),b=rows.filter(r=>!circular(r.pattern));
 const seeds=[...new Set(rows.map(r=>r.seed))], perSeed=new Map(seeds.map(s=>[s,[[],[]]]));
 for(const r of rows)perSeed.get(r.seed)[circular(r.pattern)?0:1].push(r.score);
 const diffs=[...perSeed.values()].map(([a,b])=>mean(a)-mean(b)),d=mean(diffs),crit=seeds.length===500?1.964729:seeds.length===600?1.963933:1.984217;
 const margin=crit*sd(diffs)/Math.sqrt(seeds.length);
 return {circular:stats(a),other:stats(b),difference:d,paired_ci:[d-margin,d+margin],ratio:mean(a.map(r=>r.score))/mean(b.map(r=>r.score))};
}

function overall(rows){const h={};for(const r of rows)h[r.max_tile]=(h[r.max_tile]||0)+1;return {n:rows.length,mean_score:mean(rows.map(r=>r.score)),hist:h,attempts:rows.reduce((s,r)=>s+r.attempts,0),valid:rows.reduce((s,r)=>s+r.valid_moves,0),invalid:rows.reduce((s,r)=>s+r.invalid_moves,0),best:rows.reduce((a,b)=>a.score>=b.score?a:b),top_tile_runs:rows.filter(r=>r.max_tile===Math.max(...rows.map(x=>x.max_tile))).slice(0,10)};}

const patterns=permutations([0,1,2,3]).map(p=>p.join('')),seeds=Array.from({length:500},(_,i)=>100+i);
const {rows,traces}=run(E,seeds,patterns);
const old=parse(fs.readFileSync(path.join(__dirname,'../01-cyclic-permutations/games.csv'),'utf8')),combined=old.concat(rows);
const write=(name,contents)=>fs.writeFileSync(path.join(__dirname,name),contents);
write('games.csv',csv(rows));write('summary.csv',csv(summary(rows,patterns)));write('combined-summary.csv',csv(summary(combined,patterns)));
for(let i=0;i<patterns.length;i+=4){const subset=patterns.slice(i,i+4);write('traces-'+String(i/4+1).padStart(2,'0')+'.csv',csv(traces.filter(r=>subset.includes(r.pattern))));}
write('analysis.json',JSON.stringify({fresh:overall(rows),previous:overall(old),combined:overall(combined),classes:{fresh:compare(rows),previous:compare(old),combined:compare(combined)}},null,2)+'\n');

'use strict';
const E=require('../../engine.js'),R=require('../03-all-four-input-patterns/run.js');
const fs=require('node:fs'),path=require('node:path');
function permutations(xs){return xs.length===0?[[]]:xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(p=>[x,...p]));}

function exactWord(pattern,n){return new Set(pattern).size===n;}

function generate(){
 const list=[],add=(family,word)=>{if(list.some(x=>x.pattern===word))throw Error("duplicate "+word);list.push({family,pattern:word});};
 for(let i=0;i<16;i++){const p=i.toString(4).padStart(2,'0');if(exactWord(p,2))add("two_step_two_dirs",p);}
 for(let i=0;i<64;i++){const p=i.toString(4).padStart(3,'0');const k=new Set(p).size;if(k===2)add("three_step_two_dirs",p);else if(k===3)add("three_step_three_dirs",p);}
 for(let anchor=0;anchor<4;anchor++){const axis=d=>d===0||d===3,sides=[0,1,2,3].filter(d=>axis(d)!==axis(anchor));for(const a of sides)for(const b of sides)for(const c of sides){if(a===b&&b===c)continue;add("six_step_three_dir_sweep",String(anchor)+a+anchor+b+anchor+c);}}
 for(const [a,b,c,d] of permutations([0,1,2,3])){
  add("six_step_overlapping_triples",String(a)+b+c+b+c+d);
  add("twelve_step_rolling_triples",String(a)+b+c+b+c+d+c+d+a+d+a+b);
  const p=String(a)+b+c+d;const vertical=x=>x===0||x===3;add([...p].every((x,i)=>vertical(Number(x))!==vertical(Number(p[(i+1)%4])))?"four_step_circular_baseline":"four_step_non_circular_baseline",p);
 }
 return list;
}

function simulate(F,pattern,seed){
 const dirs=[...pattern].map(Number),period=dirs.length;
 let {board,rng}=F.init(seed),next=new Uint8Array(16),score=0,valid=0,attempts=0,stalled=0,invalid=[],end_reason="terminal";
 while(!F.terminal(board)){
  if(attempts>=1000000)throw Error("Unexpected limit "+pattern+" "+seed);
  const gain=F.move(board,dirs[attempts%period],next);attempts++;
  if(gain<0){invalid.push(attempts.toString(36));if(++stalled===period){end_reason="stagnation";break;}continue;}
  stalled=0;valid++;score+=gain;[board,next]=[next,board];F.spawn(board,rng);
 }
 return {pattern,seed,score,max_tile:2**Math.max(...board),valid_moves:valid,attempts,invalid_moves:invalid.length,end_reason,invalid_steps:invalid.join(".")};
}

function reference(E,pattern,seed){
 const dirs=["up","left","right","down"];let rng=E.seededRng(seed),state=E.createGame(rng),attempts=0,stalled=0,invalid=[],reason="terminal";
 while(!state.over){let next=E.step(state,dirs[+pattern[attempts%pattern.length]],rng);attempts++;if(next===state){invalid.push(attempts.toString(36));if(++stalled===pattern.length){reason="stagnation";break;}}else{state=next;stalled=0;}}
 return {pattern,seed,score:state.score,max_tile:E.maxTile(state.board),valid_moves:state.moves,attempts,invalid_moves:invalid.length,end_reason:reason,invalid_steps:invalid.join(".")};
}

function csv(rows){const fields=Object.keys(rows[0]);return fields.join(",")+"\n"+rows.map(r=>fields.map(k=>r[k]).join(",")).join("\n")+"\n";}

function summarize(rows,family,pattern){
 const n=rows.length,vals=rows.map(x=>x.score).sort((a,b)=>a-b),mean=vals.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/(n-1));const avg=k=>rows.reduce((s,r)=>s+r[k],0)/n;let attempts=0,invalid=0;for(const r of rows){attempts+=r.attempts;invalid+=r.invalid_moves;}
 const hits=k=>rows.filter(r=>r.max_tile>=k).length;
 return {family,pattern,period:pattern.length,n,mean_score:mean,median_score:(vals[Math.floor((n-1)/2)]+vals[Math.floor(n/2)])/2,sd_score:sd,ci95_low:mean-1.964729*sd/Math.sqrt(n),ci95_high:mean+1.964729*sd/Math.sqrt(n),best_score:vals.at(-1),mean_valid_moves:avg("valid_moves"),mean_attempts:avg("attempts"),invalid_fraction:invalid/attempts,stagnated:rows.filter(r=>r.end_reason==="stagnation").length,reach256:hits(256),reach512:hits(512),reach1024:hits(1024),reach2048:hits(2048),reach65536:hits(65536),best_tile:Math.max(...rows.map(r=>r.max_tile))};
}
module.exports={permutations,exactWord,generate,simulate,reference,csv,summarize};
if(require.main===module){const F=R.buildFast(E),strategies=generate();for(const {pattern} of strategies)for(const seed of [6100,6101])if(JSON.stringify(simulate(F,pattern,seed))!==JSON.stringify(reference(E,pattern,seed)))throw Error('Mismatch '+pattern+' '+seed);const summary=[];for(let j=0;j<strategies.length;j+=28){const rows=[];for(const {pattern,family} of strategies.slice(j,j+28)){const group=Array.from({length:500},(_,i)=>simulate(F,pattern,6100+i));rows.push(...group);summary.push(summarize(group,family,pattern));}fs.writeFileSync(path.join(__dirname,'games-'+String(j/28+1).padStart(2,'0')+'.csv'),csv(rows));}fs.writeFileSync(path.join(__dirname,'summary.csv'),csv(summary.sort((a,b)=>b.mean_score-a.mean_score)));}

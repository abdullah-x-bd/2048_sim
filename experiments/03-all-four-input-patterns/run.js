'use strict';
const E=require('../../engine.js');
const fs=require('node:fs');const path=require('node:path');
function buildFast(E){
 const tables=new Int32Array(1<<20), gains=new Float64Array(1<<20);
 const lines=Array.from({length:4},(_,d)=>Array.from({length:4},(_,k)=>Array.from({length:4},(_,i)=>{
  const v=d===0||d===3,rev=d===2||d===3,j=rev?3-i:i;return v?j*4+k:k*4+j;
 })));
 function mergeKey(key){
  if(tables[key])return tables[key]-1;
  const tiles=[];for(let i=0;i<4;i++){const v=(key>>>(5*i))&31;if(v)tiles.push(v);}
  let out=0,idx=0,gain=0;
  for(let i=0;i<tiles.length;i++){let v=tiles[i];if(v===tiles[i+1]){v++;i++;if(v>31)throw Error('tile exponent overflow');gain+=2**v;}out|=v<<(5*idx++);}
  tables[key]=out+1;gains[key]=gain;return out;
 }
 function move(board,d,next){
  let changed=false,gain=0;for(const ids of lines[d]){
   const key=board[ids[0]]|(board[ids[1]]<<5)|(board[ids[2]]<<10)|(board[ids[3]]<<15);
   const out=mergeKey(key);if(key!==out)changed=true;gain+=gains[key];
   for(let i=0;i<4;i++)next[ids[i]]=(out>>>(5*i))&31;
  }return changed?gain:-1;
 }
 function spawn(board,rng){let n=0;for(let i=0;i<16;i++)if(!board[i])n++;if(!n)throw Error('no empty cell');let k=Math.floor(rng()*n);for(let i=0;i<16;i++)if(!board[i]&&k--===0){board[i]=rng()<.9?1:2;return;}}
 function terminal(b){for(let i=0;i<16;i++){if(!b[i]||(i%4!==3&&b[i]===b[i+1])||(i<12&&b[i]===b[i+4]))return false;}return true;}
 function init(seed){const rng=E.seededRng(seed),board=new Uint8Array(16);spawn(board,rng);spawn(board,rng);return {board,rng};}
 return {move,spawn,terminal,init};
}

function play(F,pattern,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),score=0,attempts=0,valid=0,streak=0,first2048=0,invalid=[],max=Math.max(...board),corner=0,empty=0,reason='terminal';
 const dirs=[...pattern].map(Number);
 while(true){
  if(attempts>=1000000)throw Error('unexpected cap '+pattern+' '+seed);
  const gain=F.move(board,dirs[attempts%4],next);attempts++;
  if(gain<0){invalid.push(attempts.toString(36));if(++streak===4){reason='stagnation';break;}continue;}
  streak=0;valid++;score+=gain;[board,next]=[next,board];F.spawn(board,rng);
  let e=0;max=0;for(let i=0;i<16;i++){if(!board[i])e++;if(board[i]>max)max=board[i];}
  empty+=e;if(board[0]===max||board[3]===max||board[12]===max||board[15]===max)corner++;
  if(max>=11&&!first2048)first2048=attempts;
  if(F.terminal(board))break;
 }
 return {pattern,seed,score,max_tile:2**max,valid_moves:valid,attempts,invalid_moves:invalid.length,end_reason:reason,first2048,corner_steps:corner,empty_sum:empty,invalid_steps:invalid.join('.')};
}

function reference(E,p,seed){const rng=E.seededRng(seed),dirs=['up','left','right','down'];let state=E.createGame(rng),attempts=0,streak=0,invalid=[],first2048=0,corner=0,empty=0;while(!state.over&&streak<4){let next=E.step(state,dirs[+p[attempts%4]],rng);attempts++;if(next===state){invalid.push(attempts.toString(36));streak++;}else{streak=0;state=next;const max=E.maxTile(state.board);empty+=E.emptyCells(state.board).length;if([state.board[0][0],state.board[0][3],state.board[3][0],state.board[3][3]].includes(max))corner++;if(max>=2048&&!first2048)first2048=attempts;}}
 return {pattern:p,seed,score:state.score,max_tile:E.maxTile(state.board),valid_moves:state.moves,attempts,invalid_moves:invalid.length,end_reason:state.over?'terminal':'stagnation',first2048,corner_steps:corner,empty_sum:empty,invalid_steps:invalid.join('.')};}

function patterns(){return Array.from({length:256},(_,i)=>i.toString(4).padStart(4,'0'));}

function features(p){const d=[...p].map(Number),counts=[0,1,2,3].map(x=>d.filter(y=>x===y).length),axis=x=>x===0||x===3;let turn=0,reverse=0,repeat=0;for(let i=0;i<4;i++){let a=d[i],b=d[(i+1)%4];if(a===b)repeat++;else if(axis(a)===axis(b))reverse++;else turn++;}
 return {distinct:counts.filter(Boolean).length,period:[1,2,4].find(k=>d.every((v,i)=>v===d[i%k])),bias:Math.hypot(counts[2]-counts[1],counts[0]-counts[3])/4,turn,reverse,repeat};}

function csv(rows){const k=Object.keys(rows[0]);return k.join(',')+'\n'+rows.map(r=>k.map(x=>r[x]).join(',')).join('\n')+'\n';}

function summarize(rows){const p=rows[0].pattern,n=rows.length,mean=k=>rows.reduce((s,r)=>s+r[k],0)/n, scores=rows.map(r=>r.score).sort((a,b)=>a-b),median=(scores[Math.floor((n-1)/2)]+scores[Math.floor(n/2)])/2, m=mean('score'),sd=Math.sqrt(scores.reduce((s,v)=>s+(v-m)**2,0)/(n-1));return {pattern:p,...features(p),n,mean_score:m,median_score:median,sd_score:sd,ci95_low:m-1.964729*sd/Math.sqrt(n),ci95_high:m+1.964729*sd/Math.sqrt(n),best_score:scores[n-1],mean_moves:mean('valid_moves'),mean_attempts:mean('attempts'),invalid_rate:rows.reduce((s,r)=>s+r.invalid_moves,0)/rows.reduce((s,r)=>s+r.attempts,0),stagnated:rows.filter(r=>r.end_reason==='stagnation').length,reach128:rows.filter(r=>r.max_tile>=128).length,reach256:rows.filter(r=>r.max_tile>=256).length,reach512:rows.filter(r=>r.max_tile>=512).length,reach1024:rows.filter(r=>r.max_tile>=1024).length,reach2048:rows.filter(r=>r.max_tile>=2048).length,best_tile:Math.max(...rows.map(r=>r.max_tile)),corner_fraction:rows.reduce((s,r)=>s+r.corner_steps,0)/rows.reduce((s,r)=>s+r.valid_moves,0),mean_empty:rows.reduce((s,r)=>s+r.empty_sum,0)/rows.reduce((s,r)=>s+r.valid_moves,0)};}

module.exports={buildFast,play,reference,patterns,features,csv,summarize};
if(require.main===module){const F=buildFast(E);for(const p of patterns())for(const seed of [600,601,999]){if(JSON.stringify(play(F,p,seed))!==JSON.stringify(reference(E,p,seed)))throw Error('Reference mismatch '+p+' '+seed);}
const summaries=[];for(let j=0;j<256;j+=16){const rows=[];for(const p of patterns().slice(j,j+16)){const g=Array.from({length:500},(_,i)=>play(F,p,600+i));rows.push(...g);summaries.push(summarize(g));}fs.writeFileSync(path.join(__dirname,'games-'+String(j/16+1).padStart(2,'0')+'.csv'),csv(rows));}fs.writeFileSync(path.join(__dirname,'summary.csv'),csv(summaries.sort((a,b)=>b.mean_score-a.mean_score)));}

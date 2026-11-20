'use strict';
const E=require('../../engine.js'),R=require('../03-all-four-input-patterns/run.js'),fs=require('node:fs'),path=require('node:path');
function playVisual(F,policy,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),scratch=new Uint8Array(16),score=0,valid=0,first2048=0,actions='';
 const dirs=[0,1,2,3],snake=[0,1,2,3,7,6,5,4,8,9,10,11,15,14,13,12],weights=[15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0];
 const count=b=>{let n=0;for(const v of b)if(v)n++;return n;};
 function mono(b){
  let penalty=0;for(let i=0;i<15;i++){const a=b[snake[i]],c=b[snake[i+1]];if(c>a)penalty+=c-a;}return penalty;
 }
 function top(b){let p=0;for(let i=0;i<3;i++)if(b[i+1]>b[i])p+=b[i+1]-b[i];return p;}
 function quality(b){let v=0;for(let i=0;i<16;i++)v+=(b[snake[i]]?2**b[snake[i]]:0)*weights[i];return v;}
 while(!F.terminal(board)){
  if(valid>=100000)throw Error('cap');
  const opts=[],before=count(board);
  for(const d of dirs){const gain=F.move(board,d,scratch);if(gain<0)continue;const max=Math.max(...scratch),merges=before-count(scratch),anchor=scratch[0]===max,edge=Math.max(...scratch.slice(0,4))===max;
   const preserve=board[0]===scratch[0]&&board[1]===scratch[1]&&board[2]===scratch[2]&&board[3]===scratch[3];
   const topFull=scratch[0]&&scratch[1]&&scratch[2]&&scratch[3];
   opts.push({d,gain,merges,anchor,edge,preserve,topFull,mono:mono(scratch),top:top(scratch),quality:quality(scratch)});
  }
  const keep=(g,p)=>{const q=g.filter(p);return q.length?q:g;};
  let o=opts;
  if(policy==='corner_order'){o=keep(o,x=>x.anchor);o.sort((a,b)=>a.top-b.top||b.merges-a.merges||b.gain-a.gain);}
  if(policy==='corner_snake'){o=keep(o,x=>x.anchor);o.sort((a,b)=>a.mono-b.mono||b.merges-a.merges||b.gain-a.gain);}
  if(policy==='corner_snakemerge'){o=keep(o,x=>x.anchor);o.sort((a,b)=>b.merges-a.merges||a.mono-b.mono||b.gain-a.gain);}
  if(policy==='lock_top'){o=keep(o,x=>x.anchor);if(board.slice(0,4).every(Boolean))o=keep(o,x=>x.preserve);o.sort((a,b)=>b.merges-a.merges||a.top-b.top||b.gain-a.gain);}
  if(policy==='edge_first'){o=keep(o,x=>x.edge);o.sort((a,b)=>b.merges-a.merges||b.gain-a.gain);}
  if(policy==='snake_weight'){o.sort((a,b)=>b.quality-a.quality||b.merges-a.merges||b.gain-a.gain);}
  if(policy==='snake_weight_space'){o.sort((a,b)=>(b.quality+100*b.merges)-(a.quality+100*a.merges)||b.gain-a.gain);}
  if(policy==='corner_order_merge'){o=keep(o,x=>x.anchor);o=keep(o,x=>x.top===0);o.sort((a,b)=>b.merges-a.merges||b.gain-a.gain);}
  const d=o[0].d,gain=F.move(board,d,next);if(gain<0)throw Error('invalid');score+=gain;valid++;actions+=d;[board,next]=[next,board];F.spawn(board,rng);if(!first2048&&Math.max(...board)>=11)first2048=valid;
 }
 return {policy,seed,score,max_tile:2**Math.max(...board),valid_moves:valid,attempts:valid,invalid_moves:0,first2048,action_trace:actions};
}
const summarize=g=>{const n=g.length,mean=k=>g.reduce((s,r)=>s+r[k],0)/n;return {policy:g[0].policy,n,mean_score:mean('score'),mean_moves:mean('valid_moves'),reach512:g.filter(r=>r.max_tile>=512).length,reach1024:g.filter(r=>r.max_tile>=1024).length,reach2048:g.filter(r=>r.first2048>0).length,reach4096:g.filter(r=>r.max_tile>=4096).length,best_score:Math.max(...g.map(r=>r.score)),best_tile:Math.max(...g.map(r=>r.max_tile))};};
const names=["corner_order","corner_snake","corner_snakemerge","lock_top","edge_first","snake_weight","snake_weight_space","corner_order_merge"];
const F=R.buildFast(E),rows=[];for(const p of names)for(let seed=2100;seed<3100;seed++)rows.push(playVisual(F,p,seed));
const summary=names.map(n=>summarize(rows.filter(r=>r.policy===n)));for(const name of names)fs.writeFileSync(path.join(__dirname,name+'.csv'),R.csv(rows.filter(r=>r.policy===name)));fs.writeFileSync(path.join(__dirname,'visual-summary.csv'),R.csv(summary));

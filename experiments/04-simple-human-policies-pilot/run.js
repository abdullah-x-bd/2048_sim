'use strict';
const E=require('../../engine.js'),R=require('../03-all-four-input-patterns/run.js'),fs=require('node:fs'),path=require('node:path');
function pilot(F,policy,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),scratch=new Uint8Array(16),score=0,valid=0,attempts=0,streak=0,phase=0,recovery=0,first2048=0,invalid=[],actions='',reason='terminal',mode=0,prev=-1;
 const count=b=>{let n=0;for(const v of b)if(v)n++;return n;};
 const priority=[0,1,2,3];
 function choose(){
  if(policy==='fixed')return [0,1,0,2][phase++%4];
  if(policy==='sweep_recover'){if(streak>=4){recovery++;return 3;}return [0,1,0,2][phase++%4];}
  if(policy==='corner_recover'){
   if(mode===1){recovery++;return 2;}if(mode===2){recovery++;return 3;}
   if(streak>=2){mode=1;recovery++;return 2;}return [0,1][phase++%2];
  }
  if(policy==='priority')return priority[mode];
  if(policy==='up_sweep'){if(mode===3){recovery++;return 3;}return [0,1,2][mode];}
  const opts=[];
  const max=Math.max(...board),before=count(board);
  for(const d of priority){const gain=F.move(board,d,scratch);if(gain<0)continue;const merges=before-count(scratch),anchor=scratch[0]===Math.max(...scratch),edge=Math.max(...scratch.slice(0,4))===Math.max(...scratch);opts.push({d,gain,merges,anchor,edge});}
  if(!opts.length)throw Error('no legal action');
  const preferred=opts.filter(x=>x.d===0||x.d===1),noDown=opts.filter(x=>x.d!==3);
  let candidates=opts;
  if(policy==='big_merge_prefer_corner'){if(preferred.some(x=>x.gain>0))candidates=preferred;else if(noDown.some(x=>x.gain>0))candidates=noDown;else if(preferred.length)candidates=preferred;else if(noDown.length)candidates=noDown;candidates.sort((a,b)=>b.gain-a.gain);}
  else if(policy==='corner_big_merge'){const a=opts.filter(x=>x.anchor);if(a.length)candidates=a;candidates.sort((a,b)=>b.gain-a.gain);}
  else if(policy==='edge_big_merge'){const a=opts.filter(x=>x.edge);if(a.length)candidates=a;candidates.sort((a,b)=>b.gain-a.gain);}
  else if(policy==='corner_most_merges'){const a=opts.filter(x=>x.anchor);if(a.length)candidates=a;candidates.sort((a,b)=>b.merges-a.merges||b.gain-a.gain);}
  else if(policy==='most_merges'){candidates.sort((a,b)=>b.merges-a.merges||b.gain-a.gain);}
  else throw Error(policy);
  return candidates[0].d;
 }
 while(true){
  if(attempts>=100000)throw Error('cap');
  const d=choose(),gain=F.move(board,d,next);attempts++;actions+=d;prev=d;
  if(gain<0){invalid.push(attempts.toString(36));streak++;
   if(policy==='fixed'&&streak===4){reason='stagnation';break;}
   if(policy==='sweep_recover'&&streak>4)throw Error('recovery blocked');
   if(policy==='corner_recover'){if(mode===1)mode=2;else if(mode===2)throw Error('both recovery directions blocked');}
   if(policy==='priority'){mode++;if(mode>=4)throw Error('priority blocked');}
   if(policy==='up_sweep'){mode++;if(mode>=4)throw Error('sweep blocked');}
   continue;
  }
  streak=0;valid++;score+=gain;[board,next]=[next,board];F.spawn(board,rng);
  if(policy==='corner_recover'&&mode){mode=0;phase=0;}
  if(policy==='priority')mode=0;
  if(policy==='up_sweep')mode=0;
  if(!first2048&&Math.max(...board)>=11)first2048=attempts;
  if(F.terminal(board))break;
 }
 return {policy,seed,score,max_tile:2**Math.max(...board),valid_moves:valid,attempts,invalid_moves:invalid.length,recovery,first2048,end_reason:reason,action_trace:actions,invalid_steps:invalid.join('.')};
}
const summarize=g=>{const n=g.length,mean=k=>g.reduce((s,r)=>s+r[k],0)/n;return {policy:g[0].policy,n,mean_score:mean('score'),mean_moves:mean('valid_moves'),mean_attempts:mean('attempts'),mean_recovery:mean('recovery'),reach512:g.filter(r=>r.max_tile>=512).length,reach1024:g.filter(r=>r.max_tile>=1024).length,reach2048:g.filter(r=>r.first2048>0).length,reach4096:g.filter(r=>r.max_tile>=4096).length,best_score:Math.max(...g.map(r=>r.score)),best_tile:Math.max(...g.map(r=>r.max_tile))};};
const names=["fixed","sweep_recover","corner_recover","priority","up_sweep","big_merge_prefer_corner","corner_big_merge","edge_big_merge","corner_most_merges","most_merges"];
const F=R.buildFast(E);const rows=[];for(const name of names)for(let seed=2100;seed<3100;seed++)rows.push(pilot(F,name,seed));
const summary=names.map(n=>summarize(rows.filter(r=>r.policy===n)));for(const name of names)fs.writeFileSync(path.join(__dirname,name+'.csv'),R.csv(rows.filter(r=>r.policy===name)));fs.writeFileSync(path.join(__dirname,'summary.csv'),R.csv(summary));

'use strict';
function variants(){return [
{id:"coarse_order_one",scale:[0,0,0,1,1,2,3,5,8,12,18,26],space:4,pairs:3,order:2,mode:"one"},
{id:"coarse_order_det",scale:[0,0,0,1,1,2,3,5,8,12,18,26],space:4,pairs:3,order:2,mode:"det"},
{id:"coarse_order_probe",scale:[0,0,0,1,1,2,3,5,8,12,18,26],space:4,pairs:3,order:2,mode:"probe"},
{id:"coarse_order_all",scale:[0,0,0,1,1,2,3,5,8,12,18,26],space:4,pairs:3,order:2,mode:"all"},
{id:"large_order_probe",scale:[0,0,0,0,1,2,4,8,16,32,64,128],space:8,pairs:5,order:1,mode:"probe"},
{id:"large_order_all",scale:[0,0,0,0,1,2,4,8,16,32,64,128],space:8,pairs:5,order:1,mode:"all"},
{id:"large_order_space",scale:[0,0,0,0,1,2,4,8,16,32,64,128],space:16,pairs:5,order:1,mode:"all"},
{id:"rounded_teacher_all",scale:[0,0,0,1,3,6,12,23,39,62,95,139],space:22,pairs:15,order:1,mode:"all",mass:0.2},
{id:"rounded_teacher_probe",scale:[0,0,0,1,3,6,12,23,39,62,95,139],space:22,pairs:15,order:1,mode:"probe",mass:0.2}
];}

function evaluator(p){
 const cache=new Float64Array(1<<20),seen=new Uint8Array(1<<20);
 function line(k){if(seen[k])return cache[k];seen[k]=1;let up=0,down=0,empty=0,pairs=0,prev=0,run=0,mass=0,old=0;
 for(let i=0;i<4;i++){const x=k>>>(i*5)&31,rank=p.scale[x]??p.scale.at(-1)*2**(x-p.scale.length+1);mass+=rank;if(i){if(rank>old)up+=rank-old;else down+=old-rank;}old=rank;if(!x){empty++;continue;}if(x===prev)run++;else{if(run)pairs+=run+1;prev=x;run=0;}}if(run)pairs+=run+1;
 return cache[k]=p.space*empty+p.pairs*pairs-p.order*Math.min(up,down)-(p.mass||0)*mass;}
 return b=>{let v=0;for(let k=0;k<4;k++){let i=k*4;v+=line(b[i]|b[i+1]<<5|b[i+2]<<10|b[i+3]<<15)+line(b[k]|b[k+4]<<5|b[k+8]<<10|b[k+12]<<15);}return v;};
}

function play(F,h,p,seed){let {board,rng}=F.init(seed),next=new Uint8Array(16),a=new Uint8Array(16),c=new Uint8Array(16),dtmp=new Uint8Array(16),score=0,moves=0,trace='';
 function bestNext(b){let best=-Infinity;for(let d=0;d<4;d++){if(F.move(b,d,c)<0)continue;const v=h(c);if(v>best)best=v;}return best===-Infinity?h(b)-100000:best;}
 function probe(b){let cand=[];for(let i=0;i<16;i++)if(!b[i]){let risk=0;for(const j of [i%4>0?i-1:-1,i%4<3?i+1:-1,i>=4?i-4:-1,i<12?i+4:-1])if(j>=0)risk+=b[j];cand.push([i,risk]);}cand.sort((a,b)=>b[1]-a[1]||a[0]-b[0]);return [...new Set([cand[0][0],cand.at(-1)[0]])];}
 while(!F.terminal(board)&&Math.max(...board)<11){let best=-Infinity,bd=-1;for(let d=0;d<4;d++){if(F.move(board,d,a)<0)continue;if(Math.max(...a)>=11){bd=d;break;}const h0=h(a);let v=h0;
 if(p.mode==="det")v=.1*h0+.9*bestNext(a);
 if(p.mode==="probe"||p.mode==="all"){let ids=p.mode==="probe"?probe(a):Array.from({length:16},(_,i)=>i).filter(i=>!a[i]);let sum=0;for(const i of ids){a[i]=1;sum+=p.mode==="all"?.9*bestNext(a):bestNext(a);if(p.mode==="all"){a[i]=2;sum+=.1*bestNext(a);}a[i]=0;}v=.1*h0+.9*sum/ids.length;}
 if(v>best){best=v;bd=d;}}
 const g=F.move(board,bd,next);if(g<0)throw Error('illegal');score+=g;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('cap');}const tile=2**Math.max(...board);return {policy:p.id,seed,score,tile,moves,won:+(tile>=2048),trace};}

function summary(g){return {policy:g[0].policy,n:g.length,wins:g.filter(r=>r.won).length,reach1024:g.filter(r=>r.tile>=1024).length,mean_score:g.reduce((s,r)=>s+r.score,0)/g.length,mean_moves:g.reduce((s,r)=>s+r.moves,0)/g.length};}
module.exports={variants,evaluator,play,summary};

'use strict';
function configs(){return [
 {id:'xiao_like',weights:[270,700,47,11,4,3.5],look:'chance'},
 {id:'more_space',weights:[540,700,47,11,4,3.5],look:'chance'},
 {id:'more_pairs',weights:[270,1400,47,11,4,3.5],look:'chance'},
 {id:'less_disorder',weights:[270,700,70,11,4,3.5],look:'chance'},
 {id:'coarse_visual',weights:[3,3,2,0,1,1],look:'chance',compact:true},
 {id:'coarse_large_order',weights:[4,3,1,0,2,1],look:'chance',compact:true},
 {id:'coarse_large_order_det',weights:[4,3,1,0,2,1],look:'det',compact:true},
 ]; }

function evaluator(p){
 const cache=new Float64Array(1<<20),seen=new Uint8Array(1<<20),[we,wm,wo,ws,po,ps]=p.weights;
 function line(k){if(seen[k])return cache[k];let a=[k&31,k>>>5&31,k>>>10&31,k>>>15&31],empty=0,merges=0,sum=0,inc=0,dec=0,prev=0,run=0;
 for(const x of a){sum+=x**ps;if(!x){empty++;continue;}if(prev===x)run++;else{if(run)merges+=1+run;run=0;prev=x;}}if(run)merges+=1+run;
 if(p.compact)a=a.filter(Boolean);
 for(let i=0;i<a.length-1;i++){const x=a[i]**po,y=a[i+1]**po;if(x>y)dec+=x-y;else inc+=y-x;}
 seen[k]=1;return cache[k]=we*empty+wm*merges-wo*Math.min(inc,dec)-ws*sum;
 }
 return b=>{let s=0;for(let k=0;k<4;k++){let i=k*4;s+=line(b[i]|b[i+1]<<5|b[i+2]<<10|b[i+3]<<15);s+=line(b[k]|b[k+4]<<5|b[k+8]<<10|b[k+12]<<15);}return s;};
}

function play(F,h,p,seed){let {board,rng}=F.init(seed),next=new Uint8Array(16),a=new Uint8Array(16),c=new Uint8Array(16),score=0,moves=0,trace='';
 function nextBest(b){let best=-Infinity;for(let d=0;d<4;d++){if(F.move(b,d,c)<0)continue;const v=h(c);if(v>best)best=v;}return best===-Infinity?h(b)-100000:best;}
 while(!F.terminal(board)&&Math.max(...board)<11){let best=-Infinity,bd=-1;for(let d=0;d<4;d++){if(F.move(board,d,a)<0)continue;if(Math.max(...a)>=11){bd=d;break;}let v=h(a);
  if(p.look==='chance'){let n=0,total=0;for(let i=0;i<16;i++)if(!a[i]){n++;a[i]=1;total+=.9*nextBest(a);a[i]=2;total+=.1*nextBest(a);a[i]=0;}v=.1*v+.9*total/n;}
  else v=.25*v+.75*nextBest(a);
  if(v>best){best=v;bd=d;}}
 const gain=F.move(board,bd,next);if(gain<0)throw Error('invalid');score+=gain;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('cap');}
 const tile=2**Math.max(...board);return {policy:p.id,seed,score,tile,moves,won:+(tile>=2048),trace};
}

function summary(g){const n=g.length,wins=g.filter(x=>x.won).length;return {policy:g[0].policy,n,wins,rate:wins/n,reach1024:g.filter(x=>x.tile>=1024).length,mean_score:g.reduce((s,x)=>s+x.score,0)/n,mean_moves:g.reduce((s,x)=>s+x.moves,0)/n};}
module.exports={configs,evaluator,play,summary};

'use strict';
function fit(data,ids){
 const n=ids.length,scale=ids.map(k=>Math.sqrt(data.reduce((s,row)=>s+row.options.reduce((z,o)=>z+o.f[k]**2,0)/row.options.length,0)/data.length)||1);
 const pairs=[];for(const row of data){const a=row.options.find(o=>o.d===row.chosen);if(!a)throw Error('teacher action not found');for(const b of row.options)if(b!==a)pairs.push(ids.map((k,i)=>(a.f[k]-b.f[k])/scale[i]));}
 const w=Array(n).fill(0);
 for(let epoch=0;epoch<150;epoch++){const grad=Array(n).fill(0);for(const x of pairs){let z=0;for(let i=0;i<n;i++)z+=x[i]*w[i];const q=1/(1+Math.exp(Math.min(z,60)));for(let i=0;i<n;i++)grad[i]+=q*x[i];}for(let i=0;i<n;i++)w[i]+=(1.8/Math.sqrt(1+epoch/30))*(grad[i]/pairs.length-.0004*w[i]);}
 return ids.map((k,i)=>w[i]/scale[i]);
}

function predict(opts,ids,w){let best=-Infinity,d=-1;for(const o of opts){if(o.win)return o.d;let v=0;for(let i=0;i<ids.length;i++)v+=w[i]*o.f[ids[i]];if(v>best){best=v;d=o.d;}}return d;}

function accuracy(data,ids,w){return data.filter(r=>predict(r.options,ids,w)===r.chosen).length/data.length;}

function specs(){return [{id:'3_visual',ids:[0,1,2],mode:0},{id:'4_visual',ids:[0,1,3,5],mode:0},{id:'immediate',ids:[0,1,2,3,4,5,6,7,8,9,10,21,22],mode:0},{id:'two_move',ids:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,21,22,23],mode:1},{id:'spawn_small',ids:[0,1,3,16,18,20],mode:2},{id:'spawn_full',ids:Array.from({length:24},(_,i)=>i),mode:2}];}

function play(F,p,seed){let {board,rng}=F.init(seed),next=new Uint8Array(16),score=0,moves=0,trace='';while(!F.terminal(board)&&Math.max(...board)<11){const d=predict(F.features.candidates(board,p.mode),p.ids,p.w);const g=F.move(board,d,next);if(g<0)throw Error('illegal student');score+=g;moves++;trace+=d;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('cap');}const tile=2**Math.max(...board);return {policy:p.id,seed,score,tile,moves,won:+(tile>=2048),trace};}

function summary(g){return {policy:g[0].policy,n:g.length,wins:g.filter(r=>r.won).length,reach1024:g.filter(r=>r.tile>=1024).length,mean_score:g.reduce((s,r)=>s+r.score,0)/g.length,mean_moves:g.reduce((s,r)=>s+r.moves,0)/g.length};}
module.exports={fit,predict,accuracy,specs,play,summary};

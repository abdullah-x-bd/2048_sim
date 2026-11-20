'use strict';
const E=require('../../engine.js'),R=require('../03-all-four-input-patterns/run.js'),B=require('../06-literature-guided/references.js'),fs=require('node:fs'),path=require('node:path');
function run(F,h,seed,threshold){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),score=0,moves=0,trace='',nodes=0;
 const scratch=[new Uint8Array(16),new Uint8Array(16),new Uint8Array(16)];
 function player(b,depth){let best=-Infinity;const a=scratch[depth];for(let d=0;d<4;d++){if(F.move(b,d,a)<0)continue;nodes++;const v=depth===0?h(a):chance(a,depth-1);if(v>best)best=v;}return best===-Infinity?h(b)-100000:best;}
 function chance(a,depth){const hv=h(a);let total=0,n=0;for(let i=0;i<16;i++)if(!a[i]){n++;a[i]=1;total+=.9*player(a,depth);a[i]=2;total+=.1*player(a,depth);a[i]=0;}return .1*hv+.9*total/n;}
 while(!F.terminal(board)){let n=0;for(const x of board)if(!x)n++;const depth=n<=threshold?1:0,a=scratch[2];let best=-Infinity,bd=-1;for(let d=0;d<4;d++){if(F.move(board,d,a)<0)continue;nodes++;const v=chance(a,depth);if(v>best){best=v;bd=d;}}
 const g=F.move(board,bd,next);if(g<0)throw Error("illegal");score+=g;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>131072)throw Error("cap");}
 return {threshold,seed,score,tile:2**Math.max(...board),moves,nodes,trace};
}
const F=R.buildFast(E),h=B.evaluator({weights:[1080,700,47,11,4,3.5]});const rows=[];for(const seed of [6000,6001,6002,6003,6004,6005,6006,6007])rows.push(run(F,h,seed,0));fs.writeFileSync(path.join(__dirname,'games.csv'),R.csv(rows));

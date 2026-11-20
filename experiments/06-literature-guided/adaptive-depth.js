'use strict';
function specs(){return [
{id:"space_810",weights:[810,700,47,11,4,3.5],threshold:0},
{id:"space_1080",weights:[1080,700,47,11,4,3.5],threshold:0},
{id:"crowded_2",weights:[540,700,47,11,4,3.5],threshold:2},
{id:"crowded_3",weights:[540,700,47,11,4,3.5],threshold:3},
{id:"crowded_4",weights:[540,700,47,11,4,3.5],threshold:4}
];}

function play(F,h,p,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),score=0,moves=0,trace='';
 const scratch=[new Uint8Array(16),new Uint8Array(16),new Uint8Array(16)];
 function player(b,depth){let best=-Infinity;const a=scratch[depth];for(let d=0;d<4;d++){if(F.move(b,d,a)<0)continue;const value=depth===0?h(a):chance(a,depth-1);if(value>best)best=value;}return best===-Infinity?h(b)-100000:best;}
 function chance(a,depth){const hv=h(a);let n=0,total=0;for(let i=0;i<16;i++)if(!a[i]){n++;a[i]=1;total+=.9*player(a,depth);a[i]=2;total+=.1*player(a,depth);a[i]=0;}return .1*hv+.9*total/n;}
 while(!F.terminal(board)&&Math.max(...board)<11){let best=-Infinity,bd=-1,n=0;for(const x of board)if(!x)n++;const depth=n<=p.threshold?1:0,a=scratch[2];for(let d=0;d<4;d++){if(F.move(board,d,a)<0)continue;if(Math.max(...a)>=11){bd=d;break;}const v=chance(a,depth);if(v>best){best=v;bd=d;}}
 const gain=F.move(board,bd,next);if(gain<0)throw Error('invalid');score+=gain;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('limit');}
 const tile=2**Math.max(...board);return {policy:p.id,seed,score,tile,moves,won:+(tile>=2048),trace};
}
module.exports={specs,play};

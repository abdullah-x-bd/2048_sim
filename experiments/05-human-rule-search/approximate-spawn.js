'use strict';
function approx(F,h,variant,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),a=new Uint8Array(16),c=new Uint8Array(16),score=0,moves=0,trace='',examined=0,lookMoves=0;
 function best(b){let v=-Infinity;for(let d=0;d<4;d++){if(F.move(b,d,c)<0)continue;let x=h(c);if(x>v)v=x;}return v===-Infinity?h(b)-100:v;}
 while(!F.terminal(board)&&Math.max(...board)<11){let highest=-Infinity,bd=-1;
 for(let d=0;d<4;d++){if(F.move(board,d,a)<0)continue;if(Math.max(...a)>=11){bd=d;break;}let value=h(a);
 const cells=[];for(let i=0;i<16;i++)if(!a[i])cells.push(i);
 let chosen=[];
 if(variant==='one_first')chosen=[cells[0]];
 if(variant==='one_last')chosen=[cells[cells.length-1]];
 if(variant==='two_ends')chosen=[...new Set([cells[0],cells[cells.length-1]])];
 if(variant==='two_middle')chosen=[...new Set([cells[Math.floor((cells.length-1)/3)],cells[Math.ceil(2*(cells.length-1)/3)]])];
 if(variant==='four_spread')chosen=[...new Set([0,1,2,3].map(i=>cells[Math.round(i*(cells.length-1)/3)]))];
 if(variant==='two_congested'&&cells.length<=5)chosen=[...new Set([cells[0],cells[cells.length-1]])];
 if(variant==='all_congested'&&cells.length<=5)chosen=cells;
 if(variant==='all')chosen=cells;
 if(chosen.length){let total=0;for(const i of chosen){a[i]=1;total+=best(a);a[i]=0;examined++;}lookMoves++;value=.1*value+.9*total/chosen.length;}
 if(value>highest){highest=value;bd=d;}}
 const g=F.move(board,bd,next);if(g<0)throw Error('invalid');score+=g;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('limit');
 }const tile=2**Math.max(...board);return {seed,score,tile,moves,won:+(tile>=2048),examined,lookMoves,trace};
}
module.exports={approx};

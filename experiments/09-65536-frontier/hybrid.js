'use strict';
function hybrid(F,C,P,path,low,seed,mode="free",depth=1,solver=null){
 let rng=F.init(seed).rng,table=solver||P(F,path,low,low*2**(low-1)+2,mode,300000);
 let board=table.initial.slice(),next=new Uint8Array(16),mass=table.baseMass,moves=0,trace="";
 for(let t=0;t<2;t++){F.spawn(board,rng);}
 mass=0;for(const x of board)if(x)mass+=2**x;
 const start=Array.from(board).join(".");
 while(!table.reached(board)&&!F.terminal(board)&&mass<table.cap){
  if(table.val(board,mass)<=0)break;const d=table.policy.get(table.key(board));if(d==null||d<0)break;
  if(F.move(board,d,next)<0)throw Error("illegal");[board,next]=[next,board];F.spawn(board,rng);
  mass=0;for(const x of board)if(x)mass+=2**x;moves++;trace+=d;
 }
 const paired=table.reached(board),part=moves;
 if(!paired)return {seed,start,paired:0,won:0,moves,production_moves:part,tile:2**Math.max(...board),capped:0,trace};
 const g=C.play(F,board,seed,depth,80,rng);
 return {seed,start,paired:1,won:g.won,moves:moves+g.moves,production_moves:part,tile:g.tile,capped:g.capped,trace:trace+g.trace};
}
module.exports=hybrid;

'use strict';
function configs(){
 return [
 {id:'empty_order',type:'lex',order:['space','ordered','pairs']},
 {id:'empty_order_2',type:'lex',order:['space','ordered','pairs'],depth:2},
 {id:'big_order_2',type:'lex',order:['space','monobig','pairs'],depth:2},
 {id:'pairs_first_2',type:'lex',order:['pairs','space','ordered'],depth:2},
 {id:'corner_order_2',type:'lex',order:['corner','space','ordered','pairs'],depth:2},
 {id:'space_safe_2',type:'lex',order:['space','pairs','ordered'],depth:2},
 {id:'safe_pairs_2',type:'lex',order:['safe','space','ordered','pairs'],depth:2},
 {id:'simple_combined',type:'weighted',space:2,pairs:2,ordered:1,monobig:0,depth:2},
 {id:'simple_combined_2',type:'weighted',space:3,pairs:1,ordered:1,monobig:0,depth:2},
 {id:'simple_big_penalty',type:'weighted',space:3,pairs:2,ordered:0,monobig:1,depth:2},
 {id:'simple_big_penalty_1',type:'weighted',space:3,pairs:2,ordered:0,monobig:1,depth:1},
 {id:'simple_big_penalty_soft',type:'weighted',space:6,pairs:4,ordered:0,monobig:1,depth:2},
 ];
}

function evaluator(){
 const cache=new Float64Array(1<<20),seen=new Uint8Array(1<<20);
 const arrs=Array.from({length:4},()=>new Float64Array(1<<20));
 function line(k){if(seen[k])return;seen[k]=1;let a=[k&31,k>>>5&31,k>>>10&31,k>>>15&31],up=0,down=0,bu=0,bd=0,pairs=0,empty=0,last=0;
 for(const x of a){if(!x){empty++;continue;}if(last){if(x===last)pairs++;if(x>last){up++;bu+=x-last>1?2:1;}else if(x<last){down++;bd+=last-x>1?2:1;}}last=x;}
 arrs[0][k]=empty;arrs[1][k]=pairs;arrs[2][k]=-Math.min(up,down);arrs[3][k]=-Math.min(bu,bd);}
 return (board)=>{
 let space=0,pairs=0,ordered=0,monobig=0,max=0;
 for(let j=0;j<4;j++){let i=j*4;for(const k of [board[i]|board[i+1]<<5|board[i+2]<<10|board[i+3]<<15,board[j]|board[j+4]<<5|board[j+8]<<10|board[j+12]<<15]){line(k);space+=arrs[0][k];pairs+=arrs[1][k];ordered+=arrs[2][k];monobig+=arrs[3][k];}}
 for(const x of board)if(x>max)max=x;
 return {space:space/2,pairs,ordered,monobig,corner:+([board[0],board[3],board[12],board[15]].includes(max)),safe: +(space>0||pairs>0),max};
 };
}

function compare(a,b){if(!b)return 1;for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]>b[i]?1:-1;}return 0;}

function play(F,evalB,p,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),tmp=new Uint8Array(16),tmp2=new Uint8Array(16),score=0,moves=0,trace='';
 const rank=(b)=>{const f=evalB(b);return p.type==='lex'?p.order.map(k=>f[k]):[p.space*f.space+p.pairs*f.pairs+p.ordered*f.ordered+p.monobig*f.monobig];};
 while(!F.terminal(board)&&Math.max(...board)<11){let best=null,bd=-1;for(let d=0;d<4;d++){const g=F.move(board,d,tmp);if(g<0)continue;if(Math.max(...tmp)>=11){bd=d;break;}
 let r=rank(tmp);
 if(p.depth===2){let r2=null;for(let d2=0;d2<4;d2++){if(F.move(tmp,d2,tmp2)<0)continue;let v=rank(tmp2);if(compare(v,r2)>0)r2=v;}if(r2&&compare(r2,r)>0)r=r2.concat(r);else r=r.concat(r);}
 if(compare(r,best)>0){best=r;bd=d;}}
 const g=F.move(board,bd,next);if(g<0)throw Error('invalid');score+=g;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('cap');
 }
 const tile=2**Math.max(...board);return {policy:p.id,seed,score,tile,moves,won:+(tile>=2048),trace};
}

function summary(g){const n=g.length,wins=g.filter(x=>x.won).length;return {policy:g[0].policy,n,wins,rate:wins/n,reach1024:g.filter(x=>x.tile>=1024).length,mean_score:g.reduce((s,x)=>s+x.score,0)/n,mean_moves:g.reduce((s,x)=>s+x.moves,0)/n};}
module.exports={configs,evaluator,compare,play,summary};

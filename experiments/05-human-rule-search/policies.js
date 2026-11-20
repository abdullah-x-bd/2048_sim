'use strict';
function specs(){
 const p=[];
 const add=(id,keys,low=null,t=-1)=>p.push({id,keys,low,t});
 add("corner_merge_badlinks",["corner","merge","links","gain"]);
 add("corner_merge_order",["corner","merge","order","gain"]);
 add("corner_order_merge",["corner","order","merge","gain"]);
 add("corner_merge_bigorder",["corner","merge","bigorder","gain"]);
 add("corner_bigorder_merge",["corner","bigorder","merge","gain"]);
 add("corner_top_order",["corner","top","order","merge"]);
 add("corner_merge_top",["corner","merge","top","order"]);
 add("corner_pairs_merge",["corner","pairs","merge","order"]);
 add("corner_merge_pairs",["corner","merge","pairs","order"]);
 add("corner_merge_prefix",["corner","merge","prefix","order"]);
 add("corner_prefix_merge",["corner","prefix","merge","order"]);
 add("corner_merge_monotone",["corner","merge","mono","order"]);
 add("edge_merge_order",["edge","merge","order","gain"]);
 add("merge_corner_order",["merge","corner","order","gain"]);
 add("merge_order_corner",["merge","order","corner","gain"]);
 for(const t of [2,4,6]){add("switch_order_"+t,["corner","order","merge","gain"],["merge","corner","order","gain"],t);add("switch_prefix_"+t,["corner","prefix","order","merge"],["merge","corner","order","gain"],t);}
 for(const w of [2,4,8,16,32])p.push({id:"weighted_"+w,w});return p;
}

function features(b){
 const snake=[0,1,2,3,7,6,5,4,8,9,10,11,15,14,13,12];
 let max=0,n=0,links=0,order=0,bigorder=0,prefix=0,top=0,prev=32,broken=false,pairs=0,mono=0;
 for(let i=0;i<16;i++){const x=b[snake[i]];if(x>max)max=x;if(!x)continue;n++;if(x>prev){links--;order-=x-prev;bigorder-=2**x-2**prev;broken=true;}if(!broken)prefix++;prev=x;if(i<4)top+=2**x;}
 for(let j=0;j<4;j++)for(let v=0;v<2;v++){let a=0,c=0,last=0;for(let k=0;k<4;k++){const x=b[v?k*4+j:j*4+k];if(x){if(x===last)pairs++;if(last){if(x>last)a+=x-last;else c+=last-x;}last=x;}}mono-=Math.min(a,c);}
 return {max,n,links,order,bigorder,prefix,top,pairs,mono,corner:+(b[0]===max),edge:+(b[0]===max||b[1]===max||b[2]===max||b[3]===max)};
}

function decision(F,b,p,tmp){
 let n=0;for(let i=0;i<16;i++)if(b[i])n++;
 let best=null,bd=-1;
 for(let d=0;d<4;d++){const gain=F.move(b,d,tmp);if(gain<0)continue;const f=features(tmp);if(f.max>=11)return d;f.merge=n-f.n;f.gain=gain;
 const rank=p.w?[f.corner*4+f.merge*p.w+f.order+2*f.mono+f.pairs]: (16-n<=p.t&&p.low?p.low:p.keys).map(k=>f[k]);
 let better=best===null; if(best){for(let k=0;k<rank.length;k++){if(rank[k]!==best[k]){better=rank[k]>best[k];break;}}}if(better){best=rank;bd=d;}
 }return bd;
}

function play(F,p,seed){
 let {board,rng}=F.init(seed),tmp=new Uint8Array(16),next=new Uint8Array(16),score=0,moves=0,trace='';
 while(!F.terminal(board)&&Math.max(...board)<11){if(moves>=100000)throw Error('limit');const d=decision(F,board,p,tmp),g=F.move(board,d,next);if(g<0)throw Error('invalid');score+=g;moves++;trace+=d;[board,next]=[next,board];F.spawn(board,rng);}
 const tile=2**Math.max(...board);return {policy:p.id,seed,score,tile,moves,won:+(tile>=2048),trace};
}

function summarize(g){const n=g.length,w=g.filter(r=>r.won).length;return {policy:g[0].policy,n,wins:w,rate:w/n,reach1024:g.filter(r=>r.tile>=1024).length,mean_score:g.reduce((s,r)=>s+r.score,0)/n,mean_moves:g.reduce((s,r)=>s+r.moves,0)/n};}
module.exports={specs,features,decision,play,summarize};

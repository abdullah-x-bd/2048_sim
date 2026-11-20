'use strict';
function paths(){
 const adj=Array.from({length:16},(_,i)=>[i%4?i-1:-1,i%4!==3?i+1:-1,i>=4?i-4:-1,i<12?i+4:-1].filter(j=>j>=0));
 const res=[];function dfs(p,mask){if(p.length===16){res.push(p);return;}for(const j of adj[p.at(-1)])if(!(mask>>j&1))dfs(p.concat(j),mask|1<<j);}
 for(const s of [0,1,5])dfs([s],1<<s);return res;
}

function symmetries(){return Array.from({length:8},(_,k)=>Array.from({length:16},(_,i)=>{let r=i>>2,c=i&3;if(k>=4)c=3-c;for(let j=0;j<k%4;j++)[r,c]=[c,3-r];return r*4+c;}));}

function boardFromPath(path){const b=new Uint8Array(16);path.forEach((i,j)=>b[i]=Math.max(1,15-j));return b;}

function layouts(){const S=symmetries(),uniq=new Map();for(const p of paths()){const b=boardFromPath(p),k=S.map(t=>String.fromCharCode(...t.map(i=>b[i]))).sort()[0];if(!uniq.has(k))uniq.set(k,p);}return [...uniq.values()];}

function evaluate(b){
 if(b.includes(16))return 10000000;
 let seen=0,k=0,empty=0,pairs=0;
 for(const x of b){if(!x){empty++;continue;}if(seen&(1<<x)){if(x>k)k=x;pairs++;}seen|=1<<x;}
 let dist=8,clear=0;
 if(k)for(let i=0;i<16;i++)if(b[i]===k)for(let j=i+1;j<16;j++)if(b[j]===k){
 const r=i>>2,c=i&3,rr=j>>2,cc=j&3;dist=Math.min(dist,Math.abs(r-rr)+Math.abs(c-cc));
 if(r===rr||c===cc){let step=r===rr?1:4,ok=true;for(let z=i+step;z<j;z+=step)if(b[z]&&b[z]!==k)ok=false;if(ok)clear=1;}
 }
 return 1000*k+80*clear-12*dist+5*empty+2*pairs;
}

function play(F,start,seed,depth=0,cap=40,rngOverride=null){
 let board=start.slice(),next=new Uint8Array(16),rng=rngOverride||F.init(seed).rng,moves=0,trace='',maxPhase=0; // independent synthetic RNG stream after two standard initial draws
 const scratch=Array.from({length:depth+2},()=>new Uint8Array(16));
 function pick(b,d){let best=-Infinity,dir=-1;const a=scratch[d];for(let i=0;i<4;i++){if(F.move(b,i,a)<0)continue;
 let v=evaluate(a);if(v>=10000000)return [v,i];
 if(d>0){let n=0,total=0;for(let j=0;j<16;j++)if(!a[j]){n++;a[j]=1;total+=.9*pick(a,d-1)[0];a[j]=2;total+=.1*pick(a,d-1)[0];a[j]=0;}v=.02*v+.98*total/n;}
 if(v>best){best=v;dir=i;}}return [dir<0?-100000:best,dir];}
 while(!F.terminal(board)&&moves<cap&&!board.includes(16)){const [_,d]=pick(board,depth);if(d<0)break;F.move(board,d,next);[board,next]=[next,board];moves++;trace+=d;F.spawn(board,rng);}
 return {seed,moves,tile:2**Math.max(...board),won:+board.includes(16),capped:+(!F.terminal(board)&&!board.includes(16)&&moves===cap),trace};
}

function summarize(g){const n=g.length,wins=g.filter(x=>x.won).length;return {n,wins,rate:wins/n,capped:g.filter(x=>x.capped).length,mean_moves:g.reduce((s,r)=>s+r.moves,0)/n};}
module.exports={paths,symmetries,boardFromPath,layouts,evaluate,play,summarize};

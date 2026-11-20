'use strict';
function featureNames(){return ["space","pairs","order","large_order","smooth","corner","edge","chain","large_chain","merge","gain","axis_options","next_merges","next_space","next_order","next_large_order","spawn_safe","spawn_merge","spawn_space","spawn_order","spawn_large_order","rank_mass","large_gaps","next_pairs"];}

function buildFeatures(F){
 const caches=new Float64Array((1<<20)*5),seen=new Uint8Array(1<<20),scratch=new Uint8Array(16),tmp=new Uint8Array(16);
 function line(k){const i=k*5;if(seen[k])return i;seen[k]=1;let prev=0,up=0,down=0,bu=0,bd=0,pairs=0,smooth=0,gaps=0;for(let j=0;j<4;j++){const x=(k>>>(j*5))&31;if(!x){if(prev>=5)gaps++;continue;}if(prev){const z=x-prev;if(z===0)pairs++;else if(z>0){up++;bu+=z*Math.max(x,prev)/8;}else{down++;bd-=z*Math.max(x,prev)/8;}smooth+=Math.abs(z);}prev=x;}caches[i]=pairs;caches[i+1]=-Math.min(up,down);caches[i+2]=-Math.min(bu,bd);caches[i+3]=-smooth;caches[i+4]=-gaps;return i;}
 function basic(b){let n=0,max=0,pairs=0,order=0,large_order=0,smooth=0,gaps=0,chain=0,large_chain=0,mass=0;for(let i=0;i<16;i++){const x=b[i];if(!x)continue;n++;max=Math.max(max,x);mass+=x*x;for(const j of [i%4<3?i+1:-1,i<12?i+4:-1])if(j>=0&&b[j]){const y=b[j];if(Math.abs(x-y)<=1){chain++;if(Math.min(x,y)>=5)large_chain++;}}}
 for(let k=0;k<4;k++){let r=k*4;for(const z of [b[r]|b[r+1]<<5|b[r+2]<<10|b[r+3]<<15,b[k]|b[k+4]<<5|b[k+8]<<10|b[k+12]<<15]){const i=line(z);pairs+=caches[i];order+=caches[i+1];large_order+=caches[i+2];smooth+=caches[i+3];gaps+=caches[i+4];}}
 let corner=0,edge=0;for(let i=0;i<16;i++)if(b[i]===max){if([0,3,12,15].includes(i))corner=1;if(i<4||i>=12||i%4===0||i%4===3)edge=1;}
 return [16-n,pairs,order,large_order,smooth,corner,edge,chain,large_chain,mass,gaps,max];
 }
 function next(b,base){let legal=0,maxM=-1,bestOrder=-Infinity,bestLarge=-Infinity,bestPairs=0;for(let d=0;d<4;d++){if(F.move(b,d,tmp)<0)continue;legal++;const v=basic(tmp);maxM=Math.max(maxM,v[0]-base[0]);bestOrder=Math.max(bestOrder,v[2]);bestLarge=Math.max(bestLarge,v[3]);bestPairs=Math.max(bestPairs,v[1]);}return [legal,Math.max(0,maxM),base[0]+Math.max(0,maxM),legal?bestOrder:base[2],legal?bestLarge:base[3],bestPairs];}
 function candidates(b,mode=2){const before=basic(b),res=[];for(let d=0;d<4;d++){const gain=F.move(b,d,scratch);if(gain<0)continue;const v=basic(scratch),m=v[0]-before[0];const f=v.slice(0,9).concat([m,gain?Math.log2(gain):0]);const n=mode>=1?next(scratch,v):[0,0,0,0,0,0];f.push(...n.slice(0,5));let safe=0,merge=0,space=0,ord=0,lg=0,k=0;
 if(mode>=2){for(let i=0;i<16;i++)if(!scratch[i]){scratch[i]=1;const a=basic(scratch),z=next(scratch,a);safe+=z[0]>0?1:0;merge+=z[1];space+=z[2];ord+=z[3];lg+=z[4];k++;scratch[i]=0;}}
 f.push(k?safe/k:0,k?merge/k:0,k?space/k:0,k?ord/k:0,k?lg/k:0,v[9],v[10],n[5]);res.push({d,f,win:v[11]>=11});}return res;}
 return {basic,candidates};
}

function replay(F,rows,stride=12){const out=[];let checked=0;for(const row of rows){let {board,rng}=F.init(row.seed),next=new Uint8Array(16),score=0;for(let i=0;i<row.trace.length;i++){const d=+row.trace[i];if(i%stride===0){const c=F.features.candidates(board,2);if(c.length>1)out.push({seed:row.seed,turn:i,chosen:d,options:c});}const g=F.move(board,d,next);if(g<0)throw Error("illegal teacher replay");score+=g;[board,next]=[next,board];F.spawn(board,rng);}if(score!==row.score||2**Math.max(...board)!==row.tile)throw Error("teacher replay mismatch");checked++;}return {out,checked};}

function parse(s){return s.trim().split("\n").slice(1).map(l=>{const [policy,seed,score,tile,moves,won,trace]=l.split(",");return {policy,seed:+seed,score:+score,tile:+tile,moves:+moves,won:+won,trace};});}
module.exports={featureNames,buildFeatures,replay,parse};

'use strict';
function layouts(){return {snake:[0,1,2,3,7,6,5,4,8,9,10,11,15,14,13,12],spiral:[0,1,2,3,7,11,15,14,13,12,8,4,5,6,10,9],fold:[0,1,2,3,7,11,15,14,10,6,5,9,13,12,8,4]};}

function createSolver(F,path,low,slack,mode="frozen",limit=500000){
 const anchors=new Int8Array(17).fill(-1),initial=new Uint8Array(16);for(let j=15;j>=low;j--){anchors[j]=path[15-j];initial[anchors[j]]=j;}
 const prefixMass=65536-2**low,cap=65536+slack, memo=new Map(),policy=new Map();let nodes=0,actions=0,cutoffs=0;
 function val(b,mass,phase){
  if(mass>cap)return 0;
  const key=String.fromCharCode(phase,...b);if(memo.has(key))return memo.get(key);
  if(++nodes>limit)throw Error("state limit "+limit);
  let best=0,bd=-1;const a=new Uint8Array(16);
  for(let d=0;d<4;d++){
   if(F.move(b,d,a)<0)continue;
   if(a.includes(16)){best=1;bd=d;break;}
   let nextPhase=phase,valid=true;
   if(phase<=15){
    while(nextPhase<=15&&!a.includes(nextPhase))nextPhase++;
    if(mode==="release"&&nextPhase>phase)nextPhase=16;
    if(mode==="pair_release"&&Array.from(a).filter(x=>x===phase).length>=2)nextPhase=16;
    if(mode==="mass_release"&&mass>=65536)nextPhase=16;
    if(nextPhase<=15){for(let j=nextPhase;j<=15;j++)if(a[anchors[j]]!==j){valid=false;break;}}
   }
   if(!valid)continue;actions++;
   let n=0;for(const x of a)if(!x)n++;if(!n)throw Error("valid move without empty");
   let sum=0;
   for(let i=0;i<16;i++)if(!a[i]){a[i]=1;if(mass+2<=cap)sum+=.9*val(a,mass+2,nextPhase);else cutoffs++;a[i]=2;if(mass+4<=cap)sum+=.1*val(a,mass+4,nextPhase);else cutoffs++;a[i]=0;}
   const p=sum/n;if(p>best||bd<0){best=p;bd=d;}
  }
  memo.set(key,best);policy.set(key,bd);return best;
 }
 function startDistribution(){let sum=0,n=0,min=1,max=0;const empty=Array.from({length:16},(_,i)=>i).filter(i=>!initial[i]);for(let x=0;x<empty.length;x++)for(let y=x+1;y<empty.length;y++)for(const a of [1,2])for(const b of [1,2]){const board=initial.slice();board[empty[x]]=a;board[empty[y]]=b;const p=val(board,prefixMass+2**a+2**b,low);sum+=p*(a===1?.9:.1)*(b===1?.9:.1);n++;min=Math.min(min,p);max=Math.max(max,p);}return {prob:sum/(empty.length*(empty.length-1)/2),n,min,max,nodes,actions,cutoffs};}
 return {val,startDistribution,initial,policy,memo,anchors,getStats:()=>({nodes,actions,cutoffs})};
}
module.exports={layouts,createSolver};

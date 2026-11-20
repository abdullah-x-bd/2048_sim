'use strict';
function production(F,path,low,slack,mode,limit=250000,terminalValue=null){
 const anchors=new Int8Array(16),initial=new Uint8Array(16);for(let k=15;k>=low;k--){anchors[k]=path[15-k];initial[anchors[k]]=k;}
 const baseMass=65536-2**low,cap=65536+slack,memo=new Map(),policy=new Map();let nodes=0;
 const key=b=>String.fromCharCode(...b);
 function reached(b){let n=0;for(const x of b)if(x===low)n++;return n>=2||b.includes(16);}
 function keep(b){if(mode==="free")return true;if(mode==="fixed"){for(let j=low;j<=15;j++)if(b[anchors[j]]!==j)return false;}else{const pos=new Int8Array(16).fill(-1);for(let i=0;i<16;i++)if(b[i]>=low)pos[b[i]]=i;for(let j=low;j<=15;j++)if(pos[j]<0)return false;for(let j=low;j<15;j++){const a=pos[j],c=pos[j+1],d=Math.abs((a>>2)-(c>>2))+Math.abs((a&3)-(c&3));if(d>(mode==="chain"?1:2))return false;}}return true;}
 function val(b,m){if(reached(b))return terminalValue?terminalValue(b):1;if(m>=cap)return 0;const k=key(b);if(memo.has(k))return memo.get(k);if(++nodes>limit)throw Error("state cap "+limit);const a=new Uint8Array(16);let best=0,bd=-1;
 for(let d=0;d<4;d++){if(F.move(b,d,a)<0)continue;if(reached(a)&&!terminalValue){best=1;bd=d;break;}if(!reached(a)&&!keep(a))continue;let n=0,sum=0;
 for(let i=0;i<16;i++)if(!a[i]){n++;a[i]=1;sum+=.9*val(a,m+2);a[i]=2;sum+=.1*val(a,m+4);a[i]=0;}
 const p=sum/n;if(p>best||bd===-1){best=p;bd=d;}}
 memo.set(k,best);policy.set(k,bd);return best;}
 function distribution(){const empty=Array.from({length:16},(_,i)=>i).filter(i=>!initial[i]);let total=0,n=0;for(let i=0;i<empty.length;i++)for(let j=i+1;j<empty.length;j++)for(const a of [1,2])for(const b of [1,2]){const v=initial.slice();v[empty[i]]=a;v[empty[j]]=b;const p=val(v,baseMass+2**a+2**b);total+=(a===1?.9:.1)*(b===1?.9:.1)*p;n++;}return {prob:total/(empty.length*(empty.length-1)/2),initial_states:n,nodes};}
 return {initial,baseMass,cap,key,reached,val,policy,distribution,nodes:()=>nodes};
}
module.exports=production;

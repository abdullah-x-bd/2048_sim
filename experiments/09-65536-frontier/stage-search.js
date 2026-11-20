'use strict';
function specs(){return [{id:"original",clip:false,chain:0,progress:0,space:1080},{id:"reserved",clip:true,chain:0,progress:100,space:1080},{id:"reserved_chain",clip:true,chain:1200,progress:100,space:1080},{id:"reserved_space",clip:true,chain:600,progress:150,space:1800}];}

function stageEval(p,low){
 const cache=new Float64Array(1<<20),seen=new Uint8Array(1<<20);
 function line(k){if(seen[k])return cache[k];seen[k]=1;let empty=0,merges=0,sum=0,inc=0,dec=0,prev=0,run=0,old=0;
 for(let i=0;i<4;i++){const x=(k>>>(5*i))&31,y=(p.clip?Math.min(x,low+1):x)**4;if(i){if(y>old)inc+=y-old;else dec+=old-y;}old=y;if(!x){empty++;continue;}
 sum+=x<low||!p.clip?x**3.5:(low+1)**3.5;
 if(prev===x)run++;else{if(run)merges+=run+1;prev=x;run=0;}}if(run)merges+=run+1;
 return cache[k]=p.space*empty+700*merges-47*Math.min(inc,dec)-11*sum;}
 return b=>{let s=0,small=0,goalCount=0,largePos=p.chain?new Int8Array(17).fill(-1):null;for(let i=0;i<16;i++){const x=b[i];if(x<low)small=Math.max(small,x);if(x===low)goalCount++;if(x>=low&&largePos)largePos[x]=i;if(x>=16)return 1e9;}for(let k=0;k<4;k++){let i=k*4;s+=line(b[i]|b[i+1]<<5|b[i+2]<<10|b[i+3]<<15)+line(b[k]|b[k+4]<<5|b[k+8]<<10|b[k+12]<<15);}
 if(goalCount>=2)return 1e8+s;
 if(largePos){for(let j=low;j<15;j++){const a=largePos[j],c=largePos[j+1];if(a>=0&&c>=0)s-=p.chain*(Math.abs((a>>2)-(c>>2))+Math.abs((a&3)-(c&3))-1);}}
 return s+p.progress*small**2;};
}

function runStage(F,C,p,path,low,seed,ev,maxMoves=5000){
 let b=new Uint8Array(16),next=new Uint8Array(16),rng=F.init(seed).rng;for(let j=15;j>=low;j--)b[path[15-j]]=j;F.spawn(b,rng);F.spawn(b,rng);
 const start=Array.from(b).join("."),a=new Uint8Array(16),c=new Uint8Array(16);let moves=0,trace="",goal=false;
 function hasPair(b){let n=0;for(const x of b)if(x===low)n++;return n>=2||b.includes(16);}
 function bestNext(b){let best=-Infinity;for(let d=0;d<4;d++){if(F.move(b,d,c)<0)continue;best=Math.max(best,ev(c));}return best===-Infinity?ev(b)-1e7:best;}
 while(!F.terminal(b)&&moves<maxMoves&&!hasPair(b)){let best=-Infinity,bd=-1;for(let d=0;d<4;d++){if(F.move(b,d,a)<0)continue;let h=ev(a),v=h;
 if(!hasPair(a)){let sum=0,n=0;for(let i=0;i<16;i++)if(!a[i]){n++;a[i]=1;sum+=.9*bestNext(a);a[i]=2;sum+=.1*bestNext(a);a[i]=0;}v=.1*h+.9*sum/n;}
 if(v>best){best=v;bd=d;}}
 if(bd<0)break;F.move(b,bd,next);[b,next]=[next,b];F.spawn(b,rng);trace+=bd;moves++;}
 goal=hasPair(b);const production_moves=moves;
 if(!goal)return {seed,start,paired:0,won:0,moves,production_moves,tile:2**Math.max(...b),capped:+(moves>=maxMoves&&!F.terminal(b)),trace};
 const g=C.play(F,b,seed,1,100,rng);return {seed,start,paired:1,won:g.won,moves:moves+g.moves,production_moves,tile:g.tile,capped:g.capped,trace:trace+g.trace};
}
module.exports={specs,stageEval,runStage};

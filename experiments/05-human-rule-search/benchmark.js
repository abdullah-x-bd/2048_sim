'use strict';
function evaluator(){
 const cache=new Float64Array(1<<20),seen=new Uint8Array(1<<20);
 function line(k){if(seen[k])return cache[k];let a=[k&31,(k>>>5)&31,(k>>>10)&31,(k>>>15)&31],empty=0,merges=0,sum=0,inc=0,dec=0,prev=0,run=0;
 for(let i=0;i<4;i++){const x=a[i];sum+=x**3.5;if(!x){empty++;continue;}if(prev===x)run++;else{if(run)merges+=1+run;run=0;prev=x;}}if(run)merges+=1+run;
 for(let i=0;i<3;i++){const x=a[i]**4,y=a[i+1]**4;if(x>y)dec+=x-y;else inc+=y-x;}
 seen[k]=1;return cache[k]=270*empty+700*merges-47*Math.min(inc,dec)-11*sum;
 }
 return b=>{let s=0;for(let k=0;k<4;k++){let i=k*4;s+=line(b[i]|b[i+1]<<5|b[i+2]<<10|b[i+3]<<15);s+=line(b[k]|b[k+4]<<5|b[k+8]<<10|b[k+12]<<15);}return s;};
}

function solve(F,evalB,p,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),a=new Uint8Array(16),c=new Uint8Array(16),dtmp=new Uint8Array(16),score=0,moves=0,trace='';
 function nextBest(b,tmp){let best=-Infinity;for(let d=0;d<4;d++){if(F.move(b,d,tmp)<0)continue;const h=evalB(tmp);if(h>best)best=h;}return best===-Infinity?evalB(b)-100000:best;}
 while(!F.terminal(board)&&Math.max(...board)<11){let best=-Infinity,bd=-1;for(let d=0;d<4;d++){if(F.move(board,d,a)<0)continue;if(Math.max(...a)>=11){bd=d;break;}const h=evalB(a);let value=h;
 if(p==='det2')value=.25*h+.75*nextBest(a,c);
 if(p==='chance2'){let total=0,n=0;for(let i=0;i<16;i++)if(!a[i]){n++;a[i]=1;total+=.9*nextBest(a,c);a[i]=2;total+=.1*nextBest(a,c);a[i]=0;}value=.1*h+.9*total/n;}
 if(value>best){best=value;bd=d;}}
 const g=F.move(board,bd,next);if(g<0)throw Error('invalid');score+=g;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('limit');
 }const tile=2**Math.max(...board);return {policy:p,seed,score,tile,moves,won:+(tile>=2048),trace};
}
module.exports={evaluator,solve};

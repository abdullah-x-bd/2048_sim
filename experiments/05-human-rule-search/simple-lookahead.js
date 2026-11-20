'use strict';
function simpleEval(kind){
 const cache=new Float64Array(1<<20),seen=new Uint8Array(1<<20);
 function line(k){if(seen[k])return cache[k];const a=[k&31,(k>>>5)&31,(k>>>10)&31,(k>>>15)&31];let empty=0,pairs=0,up=0,down=0,prior=0,run=0,upN=0,downN=0;
 for(const x of a){if(!x){empty++;continue;}if(prior===x){run++;}else{if(run)pairs+=run+1;run=0;prior=x;}}if(run)pairs+=run+1;
 for(let i=0;i<3;i++){let x=a[i],y=a[i+1];if(x>y){down+=x-y;downN++;}if(y>x){up+=y-x;upN++;}}
 let h;
 if(kind==='simple_count')h=2*empty+2*pairs-3*Math.min(upN,downN);
 else if(kind==='simple_steps')h=2*empty+2*pairs-2*Math.min(up,down);
 else if(kind==='simple_large')h=2*empty+2*pairs-3*Math.min(a.slice(0,3).reduce((s,x,i)=>s+Math.max(0,a[i+1]**2-x**2),0),a.slice(0,3).reduce((s,x,i)=>s+Math.max(0,x**2-a[i+1]**2),0))/4;
 else if(kind==='simple_space')h=3*empty+2*pairs-2*Math.min(up,down);
 else if(kind==='simple_order')h=2*empty+2*pairs-4*Math.min(up,down);
 else throw Error(kind);
 seen[k]=1;return cache[k]=h;
 }return b=>{let s=0;for(let k=0;k<4;k++){let i=k*4;s+=line(b[i]|b[i+1]<<5|b[i+2]<<10|b[i+3]<<15);s+=line(b[k]|b[k+4]<<5|b[k+8]<<10|b[k+12]<<15);}return s;};
}

function play(F,h,variant,seed){
 let {board,rng}=F.init(seed),next=new Uint8Array(16),a=new Uint8Array(16),c=new Uint8Array(16),score=0,moves=0,trace='';
 function best(b){let v=-Infinity;for(let d=0;d<4;d++){if(F.move(b,d,c)<0)continue;let x=h(c);if(x>v)v=x;}return v===-Infinity?h(b)-100:v;}
 while(!F.terminal(board)&&Math.max(...board)<11){let highest=-Infinity,bd=-1;for(let d=0;d<4;d++){if(F.move(board,d,a)<0)continue;if(Math.max(...a)>=11){bd=d;break;}let value=h(a);
 if(variant==='two_moves')value=.25*value+.75*best(a);
 if(variant==='typical_spawn'){let n=0,total=0;for(let i=0;i<16;i++)if(!a[i]){n++;a[i]=1;total+=best(a);a[i]=0;}value=.1*value+.9*total/n;}
 if(value>highest){highest=value;bd=d;}}
 const g=F.move(board,bd,next);if(g<0)throw Error('invalid');score+=g;moves++;trace+=bd;[board,next]=[next,board];F.spawn(board,rng);if(moves>100000)throw Error('limit');
 }const tile=2**Math.max(...board);return {seed,score,tile,moves,won:+(tile>=2048),trace};
}
module.exports={simpleEval,play};

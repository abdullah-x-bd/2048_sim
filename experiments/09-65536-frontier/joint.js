'use strict';
function buildJoint(F,C,P,path,low,samples=8){
 const cache=new Map();let rollouts=0;
 function value(b){const key=String.fromCharCode(...b);if(cache.has(key))return cache.get(key);let wins=0;for(let i=0;i<samples;i++){wins+=C.play(F,b,8000+i,0,60).won;rollouts++;}const v=wins/samples;cache.set(key,v);return v;}
 const table=P(F,path,low,low*2**(low-1)+2,"free",300000,value);
 return {table,stats:()=>({handoff_states:cache.size,rollouts})};
}
module.exports=buildJoint;

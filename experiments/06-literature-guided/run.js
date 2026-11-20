'use strict';
const E=require('../../engine.js'),R=require('../03-all-four-input-patterns/run.js'),H=require('./human.js'),B=require('./references.js'),A=require('./adaptive-depth.js'),fs=require('node:fs'),path=require('node:path');
const F=R.buildFast(E),write=(name,rows)=>fs.writeFileSync(path.join(__dirname,name),R.csv(rows));
function batch(mod,ps,start,end,summaryMod=mod,evaluate=mod.evaluator){
 const rows=[],summaries=[];
 for(const p of ps){const h=evaluate(p),g=[];for(let s=start;s<end;s++)g.push(mod.play(F,h,p,s));rows.push(...g);summaries.push(summaryMod.summary(g));}
 return {rows,summaries};
}
let x=batch(H,H.configs(),3300,3350);write('screening-games.csv',x.rows);write('screening.csv',x.summaries.sort((a,b)=>b.wins-a.wins||b.reach1024-a.reach1024));
x=batch(B,B.configs(),3300,3350);write('reference-games.csv',x.rows);write('reference-screening.csv',x.summaries);
x=batch(B,B.configs().filter(p=>p.id==='more_space'),3400,3700);write('benchmark-holdout.csv',x.rows);
let h=batch(H,['simple_combined','space_safe_2','empty_order_2'].map(id=>H.configs().find(p=>p.id===id)),3700,3900),b=batch(B,B.configs().filter(p=>p.id==='coarse_visual'),3700,3900);
write('simple-holdout-games.csv',h.rows.concat(b.rows));write('simple-holdout-summary.csv',h.summaries.concat(b.summaries));
x=batch(A,A.specs().filter(p=>p.threshold===0),3900,4000,B,B.evaluator);write('space-games.csv',x.rows);write('space-screening.csv',x.summaries);
x=batch(A,A.specs().filter(p=>p.id==='space_1080'),4000,4300,B,B.evaluator);write('space-holdout-games.csv',x.rows);write('space-holdout-summary.csv',x.summaries);

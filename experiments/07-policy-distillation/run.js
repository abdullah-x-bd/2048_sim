'use strict';
const fs=require('node:fs'),path=require('node:path');
const E=require('../../engine.js'),R=require('../03-all-four-input-patterns/run.js'),D=require('./features.js'),M=require('./distill.js'),C=require('./coarse.js'),A=require('./adaptive-probes.js'),G=require('./grouped.js'),S=require('./shortlist.js'),audit=require('./audit.js');
const F=R.buildFast(E);F.features=D.buildFeatures(F);
const write=(name,rows)=>fs.writeFileSync(path.join(__dirname,name),R.csv(rows));
const teacher=D.parse(fs.readFileSync(path.join(__dirname,'../06-literature-guided/space-holdout-games.csv'),'utf8'));
const train=D.replay(F,teacher.slice(0,60),20),test=D.replay(F,teacher.slice(60,80),20);
const models=M.specs().map(p=>{const w=M.fit(train.out,p.ids);return {...p,w,train_acc:M.accuracy(train.out,p.ids,w),test_acc:M.accuracy(test.out,p.ids,w)};});
fs.writeFileSync(path.join(__dirname,'models.json'),JSON.stringify({teacher_train_games:train.checked,teacher_test_games:test.checked,train_states:train.out.length,test_states:test.out.length,feature_names:D.featureNames(),models},null,2)+'\n');
function batch(mod,ps,from,to){const rows=[],ss=[];for(const p of ps){const h=mod===M?null:mod.evaluator(p),g=[];for(let s=from;s<to;s++)g.push(mod===M?M.play(F,p,s):mod.play(F,h,p,s));rows.push(...g);ss.push(mod.summary(g));}return {rows,ss};}
function save(prefix,x){write(prefix+'.csv',x.ss);write(prefix+'-games.csv',x.rows);}
save('screening-fast',batch(M,models.filter(p=>p.mode<2),4300,4500));
save('screening-spawn',batch(M,models.filter(p=>p.mode===2),4300,4350));
save('coarse-screening',batch(C,C.variants(),4500,4550));
function ci(s){const n=s.n,q=s.wins/n,z=1.959964,den=1+z*z/n,mid=(q+z*z/(2*n))/den,rad=z*Math.sqrt(q*(1-q)/n+z*z/(4*n*n))/den;return {...s,rate:q,ci_low:mid-rad,ci_high:mid+rad};}
let x=batch(C,C.variants().filter(p=>p.id==='coarse_order_probe'),4600,4900);write('probe-holdout-summary.csv',x.ss);write('probe-holdout-games.csv',x.rows);
save('adaptive-screening',batch(A,A.variants(),4900,4950));
x=batch(A,['one_probe_at_4','two_probe_at_4','two_probe_at_2','grouped_probe_at_6'].map(id=>A.variants().find(p=>p.id===id)),5000,5300);write('adaptive-holdout-summary.csv',x.ss.map(ci));write('adaptive-holdout-games.csv',x.rows);
save('grouped-screening',batch(G,G.variants(),5300,5350));
save('shortlist-screening',batch(S,S.variants(),5350,5400));
const ss=[];for(const [mod,id] of [[G,'grouped_single_6'],[G,'grouped_single_4_lower_space'],[S,'shortlist_at_4'],[S,'nearest_at_4'],[S,'merge_next_at_4']]){const p=mod.variants().find(p=>p.id===id),h=mod.evaluator(p),g=[];let probeTurns=0,probes=0,turns=0;for(let seed=5400;seed<5700;seed++){const row=mod.play(F,h,p,seed);g.push(row);const a=audit(F,p,row);probeTurns+=a.probeTurns;probes+=a.probes;turns+=a.turns;}ss.push({...ci(mod.summary(g)),probe_turn_fraction:probeTurns/turns,probe_candidates_per_move:probes/turns});write('final-holdout-'+id+'.csv',g);}
write('final-holdout-summary.csv',ss);
function binomialUpper(n,w){let v=2**(-n),sum=0;for(let k=0;k<=n;k++){if(k>=w)sum+=v;v*=(n-k)/(k+1);}return sum;}
let m=0;const stats=ss.map(x=>({policy:x.policy,n:x.n,wins:x.wins,rate:x.rate,p_one_sided:binomialUpper(x.n,x.wins)})).sort((a,b)=>a.p_one_sided-b.p_one_sided);for(let i=0;i<stats.length;i++){m=Math.max(m,Math.min(1,(stats.length-i)*stats[i].p_one_sided));stats[i].holm_p=m;}
fs.writeFileSync(path.join(__dirname,'threshold-tests.json'),JSON.stringify({null:'p <= 0.5',alternative:'p > 0.5',method:'Exact one-sided binomial; Holm over five final holdout policies',results:stats},null,2)+'\n');

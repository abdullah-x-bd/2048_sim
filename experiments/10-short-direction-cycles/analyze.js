'use strict';
const fs=require('node:fs'),path=require('node:path'),X=require('./run.js');
function parseCSV(s){const lines=s.trimEnd().split("\n");const fields=lines.shift().split(",");return lines.map(l=>{const v=l.split(",");return Object.fromEntries(fields.map((f,i)=>[f,["pattern","end_reason","invalid_steps"].includes(f)?v[i]:+v[i]]));});}

function mean(a){return a.reduce((s,x)=>s+x,0)/a.length;}

function sd(a){const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1));}

function paired(a,b){const seeds=[...a.keys()].sort((x,y)=>x-y),diff=seeds.map(s=>mean(a.get(s))-mean(b.get(s))),m=mean(diff),s=sd(diff),margin=1.964729*s/Math.sqrt(diff.length);return {seeds:seeds.length,mean_difference:m,ci95:[m-margin,m+margin],cohen_dz:m/s,positive:diff.filter(x=>x>0).length,negative:diff.filter(x=>x<0).length,ties:diff.filter(x=>x===0).length,min:Math.min(...diff),max:Math.max(...diff)};}

function analyse(rows,defs){
 const map=new Map(defs.map(x=>[x.pattern,x.family])),families=new Map(),seedGroups=new Map(),seen=new Set();
 for(const r of rows){
  if(!map.has(r.pattern))throw Error("Unknown pattern "+r.pattern);
  const key=r.pattern+"|"+r.seed;if(seen.has(key))throw Error("Duplicate "+key);seen.add(key);
  if(r.seed<6100||r.seed>6599||r.attempts!==r.valid_moves+r.invalid_moves||r.invalid_moves!==(r.invalid_steps? r.invalid_steps.split(".").length:0))throw Error("Invalid record "+key);
  const f=map.get(r.pattern),group=families.get(f)??[];group.push(r);families.set(f,group);
  const s=seedGroups.get(f)??new Map(),g=s.get(r.seed)??[];g.push(r.score);s.set(r.seed,g);seedGroups.set(f,s);
 }
 if(rows.length!==defs.length*500||seen.size!==rows.length)throw Error("Dataset incomplete");
 const summary=[...families].map(([family,g])=>{
  const patterns=new Set(g.map(r=>r.pattern)).size,n=g.length,scores=g.map(r=>r.score),moves=g.map(r=>r.valid_moves);
  const attempts=g.reduce((s,r)=>s+r.attempts,0),invalid=g.reduce((s,r)=>s+r.invalid_moves,0);
  return {family,patterns,n,mean_score:mean(scores),sd_score:sd(scores),mean_moves:mean(moves),mean_attempts:attempts/n,invalid_rate:invalid/attempts,stagnated:g.filter(r=>r.end_reason==="stagnation").length,stagnation_rate:g.filter(r=>r.end_reason==="stagnation").length/n,reach256:g.filter(r=>r.max_tile>=256).length,reach512:g.filter(r=>r.max_tile>=512).length,reach1024:g.filter(r=>r.max_tile>=1024).length,reach2048:g.filter(r=>r.max_tile>=2048).length,reach65536:g.filter(r=>r.max_tile>=65536).length,best_score:Math.max(...scores),best_tile:Math.max(...g.map(r=>r.max_tile))};
 }).sort((a,b)=>b.mean_score-a.mean_score);
 const target="four_step_biased_baseline",comparisons=Object.fromEntries(summary.filter(r=>r.family!==target).map(r=>[r.family,paired(seedGroups.get(target),seedGroups.get(r.family))]));
 const top=[...new Set(defs.map(x=>x.pattern))].map(p=>{const g=rows.filter(r=>r.pattern===p);return {family:map.get(p),pattern:p,mean_score:mean(g.map(r=>r.score)),best_score:Math.max(...g.map(r=>r.score)),best_tile:Math.max(...g.map(r=>r.max_tile)),reach1024:g.filter(r=>r.max_tile>=1024).length};}).sort((a,b)=>b.mean_score-a.mean_score).slice(0,20);
 const counts={games:rows.length,strategies:defs.length,seeds:500,attempts:rows.reduce((s,r)=>s+r.attempts,0),valid:rows.reduce((s,r)=>s+r.valid_moves,0),noops:rows.reduce((s,r)=>s+r.invalid_moves,0),stagnated:rows.filter(r=>r.end_reason==="stagnation").length,reach1024:rows.filter(r=>r.max_tile>=1024).length,wins2048:rows.filter(r=>r.max_tile>=2048).length,best_score:Math.max(...rows.map(r=>r.score)),best_tile:Math.max(...rows.map(r=>r.max_tile))};
 return {counts,families:summary,comparisons,top};
}

function csv(rows){const fields=Object.keys(rows[0]);return fields.join(",")+"\n"+rows.map(r=>fields.map(k=>r[k]).join(",")).join("\n")+"\n";}
if(require.main===module){const rows=Array.from({length:7},(_,i)=>parseCSV(fs.readFileSync(path.join(__dirname,'games-'+String(i+1).padStart(2,'0')+'.csv'),'utf8'))).flat();const a=analyse(rows,X.generate());fs.writeFileSync(path.join(__dirname,'analysis.json'),JSON.stringify(a,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'family-summary.csv'),csv(a.families));}
module.exports={parseCSV,mean,sd,paired,analyse,csv};

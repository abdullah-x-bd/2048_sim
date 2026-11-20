'use strict';
const fs=require('node:fs');
const path=require('node:path');

function parse(s){return s.trim().split('\n').slice(1).map(l=>{const [pattern,...v]=l.split(',');const [seed,score,max_tile,valid_moves,attempts,invalid_moves,won]=v.map(Number);return {pattern,seed,score,max_tile,valid_moves,attempts,invalid_moves,won};});}

function table(s){const [h,...lines]=s.trim().split('\n'),ks=h.split(',');return lines.map(l=>Object.fromEntries(l.split(',').map((v,i)=>[ks[i],i?Number(v):v])));}

function circular(p){const axis=d=>d==='0'||d==='3';return [...p].every((d,i)=>axis(d)!==axis(p[(i+1)%4]));}

function mean(a){return a.reduce((s,v)=>s+v,0)/a.length;}

function figures(rows,stats,patterns){
 const A=rows.filter(r=>circular(r.pattern)),B=rows.filter(r=>!circular(r.pattern)),colors=['#087f8c','#64748b'],ink='#172b3b',muted='#526477',grid='#dbe4eb',paper='#ffffff';
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const text=(x,y,s,opt='')=>`<text x="${x}" y="${y}" ${opt}>${esc(s)}</text>`;
 const line=(x1,y1,x2,y2,opt='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${opt}/>`;
 const rect=(x,y,w,h,opt='')=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" ${opt}/>`;
 const path=(d,opt='')=>`<path d="${d}" ${opt}/>`;
 const title=(t,sub,w,h,body,foot)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(t)}</title><rect width="${w}" height="${h}" fill="${paper}"/><g font-family="Arial, Helvetica, sans-serif" font-size="13" fill="${ink}">${text(26,34,t,'font-weight="bold" font-size="22"')}${text(26,57,sub,`fill="${muted}"`)}${body}${text(26,h-16,foot,`fill="${muted}" font-size="11"`)}</g></svg>`;
 const legend=(x,y)=>rect(x,y-10,12,12,`fill="${colors[0]}"`)+text(x+19,y,'Circular (n = 4,800)')+rect(x+190,y-10,12,12,`fill="${colors[1]}"`)+text(x+209,y,'Other (n = 9,600)');
 const files={};
 // Forest plot, individual strategy marginal CIs.
 {const w=840,h=790,l=100,r=708,top=118,step=24,x=v=>l+v/2700*(r-l);let z=legend(100,86);
 for(let v=0;v<=2500;v+=500){z+=line(x(v),top-16,x(v),top+24*step-8,`stroke="${grid}"`)+text(x(v),top+24*step+12,v,'text-anchor="middle"');}
 patterns.forEach((p,i)=>{const y=top+i*step,c=circular(p.pattern)?colors[0]:colors[1];z+=text(l-13,y+4,p.pattern,'text-anchor="end" font-family="monospace" font-weight="bold"')+line(x(p.ci95_low),y,x(p.ci95_high),y,`stroke="${c}" stroke-width="2"`)+line(x(p.ci95_low),y-4,x(p.ci95_low),y+4,`stroke="${c}"`)+line(x(p.ci95_high),y-4,x(p.ci95_high),y+4,`stroke="${c}"`)+`<circle cx="${x(p.mean_score)}" cy="${y}" r="4.5" fill="${c}"/>`+text(r+14,y+4,p.mean_score.toFixed(1));});
 z+=text((l+r)/2,top+24*step+40,'Mean final score','text-anchor="middle"');
 files["01-strategy-forest.svg"]=title('All 24 strategies separate into two classes','600 games per pattern; mean score with marginal 95% t intervals',w,h,z,'Intervals are descriptive, not simultaneous; within-class rankings are not intrinsic.');}
 // Score histograms normalized within group.
 {const w=840,h=400,l=75,r=808,t=104,b=325,x=v=>l+v/7500*(r-l);let z=legend(75,83);const bins=Array.from({length:30},(_,i)=>i*250);const hs=[A,B].map(g=>bins.map(v=>100*g.filter(r=>r.score>=v&&r.score<v+250).length/g.length));const ymax=Math.ceil(Math.max(...hs.flat())/5)*5,y=v=>b-v/ymax*(b-t);
 for(let v=0;v<=ymax;v+=5){z+=line(l,y(v),r,y(v),`stroke="${grid}"`)+text(l-9,y(v)+4,v+'%','text-anchor="end"');}
 for(let v=0;v<=7500;v+=1500)z+=text(x(v),b+20,v,'text-anchor="middle"');
 hs.forEach((h,j)=>{h.forEach((v,i)=>{const left=x(bins[i]),bw=x(250)-l;z+=rect(left+j*bw/2,y(v),bw/2-0.5,b-y(v),`fill="${colors[j]}"`);});});
 z+=text((l+r)/2,b+43,'Final score (250-point bins)','text-anchor="middle"');files["02-score-distribution.svg"]=title('Score distributions','All 14,400 games; percentages normalized within each class',w,h,z,'The circular class shifts the distribution and substantially extends the high-score tail.');}
 // Survival empirical exceedance for valid moves.
 {const w=840,h=420,l=74,r=805,t=106,b=340,x=v=>l+v/525*(r-l),y=v=>b-v*(b-t);let z=legend(74,83);
 for(let v=0;v<=1.001;v+=.2)z+=line(l,y(v),r,y(v),`stroke="${grid}"`)+text(l-10,y(v)+4,Math.round(100*v)+'%','text-anchor="end"');
 for(let v=0;v<=500;v+=100)z+=text(x(v),b+20,v,'text-anchor="middle"');
 for(const [j,g] of [A,B].entries()){const freq=new Map();g.forEach(r=>freq.set(r.valid_moves,(freq.get(r.valid_moves)||0)+1));let remaining=g.length,d=`M${x(0)} ${y(1)}`;for(let m=1;m<=525;m++){d+=` H${x(m)}`;remaining-=freq.get(m-1)||0;d+=` V${y(remaining/g.length)}`;}z+=path(d,`fill="none" stroke="${colors[j]}" stroke-width="2.7"`);}
 z+=text((l+r)/2,b+43,'Valid moves survived (at least)','text-anchor="middle"');files["03-move-survival.svg"]=title('Circular policies survive longer','Empirical survival curves for valid moves',w,h,z,'Median lifetimes: 195 valid moves (circular), 117 (other).');}
 // Threshold achievement.
 {const w=840,h=430,l=78,r=808,t=105,b=336,y=v=>b-v/100*(b-t);let z=legend(75,82);
 for(let v=0;v<=100;v+=20)z+=line(l,y(v),r,y(v),`stroke="${grid}"`)+text(l-10,y(v)+4,v+'%','text-anchor="end"');
 const thresholds=[64,128,256,512,1024,2048],bw=(r-l)/thresholds.length;
 thresholds.forEach((v,i)=>{const cx=l+(i+.5)*bw;[A,B].forEach((g,j)=>{const p=100*g.filter(r=>r.max_tile>=v).length/g.length;const x=cx+(j-1)*36;z+=rect(x,y(p),32,b-y(p),`fill="${colors[j]}"`)+text(x+16,y(p)-6,p.toFixed(1)+'%',`text-anchor="middle" font-size="10" fill="${colors[j]}"`);});z+=text(cx,b+22,v,'text-anchor="middle" font-weight="bold"');});
 z+=text((l+r)/2,b+46,'Tile threshold reached','text-anchor="middle"');files["04-tile-thresholds.svg"]=title('Probability of reaching larger tiles','Observed proportion reaching at least each tile; both experiments combined',w,h,z,'No game reached 1024 or 2048; observed zero does not establish impossibility.');}
 // Seed differences.
 {const m=new Map();rows.forEach(r=>{if(!m.has(r.seed))m.set(r.seed,[[],[]]);m.get(r.seed)[circular(r.pattern)?0:1].push(r.score);});const diffs=[...m.values()].map(([a,b])=>mean(a)-mean(b)),w=840,h=400,l=75,r=805,t=105,b=327,maxX=Math.ceil(Math.max(...diffs)/250)*250,x=v=>l+v/maxX*(r-l),bins=Array.from({length:maxX/100|0},(_,i)=>i*100);if(bins[bins.length-1]+100<maxX)bins.push(bins[bins.length-1]+100);const counts=bins.map(v=>diffs.filter(d=>d>=v&&d<v+100).length),maxY=Math.ceil(Math.max(...counts)/10)*10,y=v=>b-v/maxY*(b-t);let z='';
 for(let v=0;v<=maxY;v+=10)z+=line(l,y(v),r,y(v),`stroke="${grid}"`)+text(l-9,y(v)+4,v,'text-anchor="end"');
 for(let v=0;v<=maxX;v+=500)z+=text(x(v),b+20,v,'text-anchor="middle"');
 counts.forEach((c,i)=>z+=rect(x(bins[i]),y(c),x(100)-l-1,b-y(c),`fill="${colors[0]}"`));const m0=mean(diffs);z+=line(x(m0),t,x(m0),b,`stroke="#c05b29" stroke-width="2" stroke-dasharray="5 4"`)+text(x(m0)+7,t-9,'Mean '+m0.toFixed(1),`fill="#a3471c"`)+text((l+r)/2,b+42,'Seed-level mean score difference (circular minus other)','text-anchor="middle"');files["05-paired-differences.svg"]=title('The advantage holds for every seed','600 paired seed-level differences; 100-point bins',w,h,z,`Range: ${Math.min(...diffs).toFixed(1)} to ${Math.max(...diffs).toFixed(1)} points; all 600 differences positive.`);}
 // Mechanism comparisons.
 {const w=840,h=430,l=245,r=770,top=108,max=1,x=v=>l+v/max*(r-l);let z='';const d=stats.mechanisms.transition.filter(x=>x.transition!=='initial');const order=[d.find(x=>x.class==='circular'),d.find(x=>x.class==='other'&&x.transition==='turn'),d.find(x=>x.class==='other'&&x.transition==='reverse')],labels=['Circular: 90° turn','Other: 90° turn','Other: 180° reversal'];
 for(let v=0;v<=1.001;v+=.2)z+=line(x(v),top-18,x(v),top+3*68-10,`stroke="${grid}"`)+text(x(v),top+3*68+10,v.toFixed(1),'text-anchor="middle"');
 order.forEach((d,i)=>{const y=top+i*68,c=i===0?colors[0]:i===1?colors[1]:'#bd6b3c';z+=text(l-10,y+19,labels[i],'text-anchor="end" font-weight="bold"')+rect(l,y,x(d.merges_per_attempt)-l,31,`fill="${c}" rx="3"`)+text(x(d.merges_per_attempt)+9,y+20,d.merges_per_attempt.toFixed(3),'font-weight="bold"');});
 z+=text((l+r)/2,top+3*68+33,'Mean merges per attempted input','text-anchor="middle"')+text(26,385,'First 12 inputs: circular games average 7.398 merges vs 7.053 in other games.','font-size="13" font-weight="bold"');
 files["06-early-mechanism.svg"]=title('Reversals generate fewer early merges','First 12 attempted inputs, fresh replication; 44,000 attempts per shown category',w,h,z,'Observational transition comparison; board states and phases differ across categories.');}
 return files;
}

const old=parse(fs.readFileSync(path.join(__dirname,'../01-cyclic-permutations/games.csv'),'utf8'));
const fresh=parse(fs.readFileSync(path.join(__dirname,'games.csv'),'utf8'));
const stats=JSON.parse(fs.readFileSync(path.join(__dirname,'statistics.json'),'utf8'));
const patterns=table(fs.readFileSync(path.join(__dirname,'combined-summary.csv'),'utf8'));
const folder=path.join(__dirname,'figures');fs.mkdirSync(folder,{recursive:true});
for(const [name,contents] of Object.entries(figures(old.concat(fresh),stats,patterns)))fs.writeFileSync(path.join(folder,name),contents+'\n');

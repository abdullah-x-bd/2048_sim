'use strict';
const fs=require('node:fs'),path=require('node:path');
function charts(S,V){
 const colors=['#087f8c','#61768a','#c18c38','#a6aeb8'],ink='#172b3b';
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
 const t=(x,y,s,extra='')=>'<text x="'+x+'" y="'+y+'" '+extra+'>'+esc(s)+'</text>';
 const rect=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'" rx="3"/>';
 function bar(title,sub,rows,max,format,foot){const w=880,h=124+rows.length*43+50,l=265,r=755,bw=r-l;let z='';rows.forEach((row,i)=>{const y=105+i*43;z+=t(l-12,y+18,row[0],'text-anchor="end" font-weight="bold"')+rect(l,y,row[1]/max*bw,25,colors[row[2]??0])+t(l+row[1]/max*bw+8,y+18,format(row[1]));});return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><title>'+esc(title)+'</title><rect width="100%" height="100%" fill="white"/><g font-family="Arial,sans-serif" font-size="13" fill="'+ink+'">'+t(24,33,title,'font-size="22" font-weight="bold"')+t(24,57,sub,'fill="#526477"')+z+t(24,h-20,foot,'font-size="11" fill="#526477"')+'</g></svg>';}
 const c=S.by_class,h=V.holdout.metrics;const f={};
 f['01-family-comparison.svg']=bar('Three-direction alternating policies lead','128,000 discovery games; means across all strategy members',[['Biased alternating',c.biased_alternating.mean_score,0],['Circular',c.circular.mean_score,1],['Other patterns',c.other.mean_score,3],['Two-direction alternating',c.two_direction_alternating.mean_score,2]],4000,x=>x.toFixed(1),'All 16 highest-ranked patterns belong to the biased alternating family.');
 f['02-distinct-directions.svg']=bar('Using fewer directions is not always better','Mean score by number of distinct inputs in a four-step cycle',Object.entries(S.by_distinct).map(([k,v])=>[k+' distinct direction(s)',v.mean_score,Number(k)===3?0:1]),2000,x=>x.toFixed(1),'All three-direction patterns averaged together; strong variation exists within this group.');
 f['03-holdout-thresholds.svg']=bar('Held-out replication: reaching larger tiles','16,000 biased and 8,000 circular games; percentage reaching threshold',[['Biased: 512+',100*h.reach512.biased,0],['Circular: 512+',100*h.reach512.circular,1],['Biased: 1024+',100*h.reach1024.biased,0],['Circular: 1024+',100*h.reach1024.circular,1]],32,x=>x.toFixed(3)+'%','No game reached 2048. Small 1024 bars reflect rare events, not zero.');
 f['04-stagnation-corner.svg']=bar('Corner retention is not sufficient','Discovery: pooled fraction of valid steps with a maximum tile in any corner',[['Two-direction alternating',100*c.two_direction_alternating.corner_fraction,2],['Other patterns',100*c.other.corner_fraction,3],['Circular',100*c.circular.corner_fraction,1],['Biased alternating',100*c.biased_alternating.corner_fraction,0]],100,x=>x.toFixed(2)+'%','Corner occupancy is descriptive, time-weighted and does not measure stable edge organisation.');
 f['05-top-patterns.svg']=bar('Top 16 patterns: all biased alternating','Discovery mean scores; 500 games per pattern',S.top.slice(0,16).map(r=>[r.pattern,r.mean_score,0]),4100,x=>x.toFixed(1),'Numerical rankings are exploratory; holdout comparison is at the family level.');
 return f;
}
if(require.main===module){const S=JSON.parse(fs.readFileSync(path.join(__dirname,'structural-summary.json'))),V=JSON.parse(fs.readFileSync(path.join(__dirname,'validation.json')));fs.mkdirSync(path.join(__dirname,'figures'),{recursive:true});for(const [n,x] of Object.entries(charts(S,V)))fs.writeFileSync(path.join(__dirname,'figures',n),x+'\n');}
module.exports=charts;

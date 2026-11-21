'use strict';
const fs=require('node:fs'),path=require('node:path');
function figures(a){
 const colors=["#0d9488","#20a4a0","#64748b","#8999a7","#95a2ae","#a9b1b9","#b7bec5","#d77b49","#d77b49"],
 labels={
 four_step_biased_baseline:"4-step asymmetric, three directions",
 six_step_three_dir_sweep:"6-step asymmetric, three directions",
 four_step_circular_baseline:"4-step circular, four directions",
 three_step_three_dirs:"3-step, three directions",
 six_step_overlapping_triples:"6-step overlapping triples",
 twelve_step_rolling_triples:"12-step rolling triples",
 four_step_non_circular_baseline:"4-step non-circular, four directions",
 three_step_two_dirs:"3-step, two directions",
 two_step_two_dirs:"2-step, two directions"};
 const header=(title,sub)=>`<rect width="900" height="600" fill="#fff"/><g font-family="Arial,Helvetica,sans-serif" fill="#173243"><text x="26" y="36" font-size="22" font-weight="bold">${title}</text><text x="26" y="61" font-size="13" fill="#526477">${sub}</text>`;
 const tail=(s)=>`<text x="26" y="578" font-size="12" fill="#526477">${s}</text></g>`;
 let scores=header("Short periodic strategies: score by family","92,000 games, 500 seeds per pattern; original game rules");
 for(let i=0;i<a.families.length;i++){const f=a.families[i],y=101+i*48;const c=colors[i];scores+=`<text x="307" y="${y+14}" text-anchor="end" font-size="13">${labels[f.family]}</text><rect x="326" y="${y-2}" width="${(f.mean_score/4300)*480}" height="23" rx="4" fill="${c}"/><text x="${336+(f.mean_score/4300)*480}" y="${y+14}" font-size="13" font-weight="bold">${f.mean_score.toFixed(0)}</text>`;}
 const chart1=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><title>Mean scores of 9 periodic policy families</title>${scores}${tail("0 games reached 2048. Fixed policies are compared on the same 500 seeds.")}</svg>\n`;
 let next=header("Direction restriction changes the game","Share reaching tile 512 compared with share ending in policy stagnation");
 for(let i=0;i<a.families.length;i++){const f=a.families[i],y=94+i*49,x=320,w=420;const hit=100*f.reach512/f.n,stall=100*f.stagnation_rate;next+=`<text x="300" y="${y+15}" text-anchor="end" font-size="12">${labels[f.family]}</text><rect x="${x}" y="${y-3}" width="${hit/100*w}" height="16" rx="2" fill="#0d9488"/><rect x="${x}" y="${y+15}" width="${stall/100*w}" height="12" rx="2" fill="#d77b49"/><text x="755" y="${y+11}" font-size="12">${hit.toFixed(2)}% / ${stall.toFixed(1)}%</text>`;}
 const chart2=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><title>512 attainment and stagnation by cycle family</title>${next}<rect x="330" y="549" width="12" height="12" fill="#0d9488"/><text x="349" y="559" font-size="12">Reached 512</text><rect x="470" y="549" width="12" height="12" fill="#d77b49"/><text x="489" y="559" font-size="12">Policy stagnation</text></g></svg>\n`;
 return {"family-mean-score.svg":chart1,"512-and-stagnation.svg":chart2};
}
if(require.main===module){const a=JSON.parse(fs.readFileSync(path.join(__dirname,'analysis.json'),'utf8'));fs.mkdirSync(path.join(__dirname,'figures'),{recursive:true});for(const [name,svg] of Object.entries(figures(a)))fs.writeFileSync(path.join(__dirname,'figures',name),svg);}
module.exports=figures;

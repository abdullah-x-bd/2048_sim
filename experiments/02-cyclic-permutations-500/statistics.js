'use strict';
const E=require('../../engine.js');
const fs=require('node:fs');
const path=require('node:path');

function parse(s){return s.trim().split('\n').slice(1).map(l=>{const [pattern,...v]=l.split(',');const [seed,score,max_tile,valid_moves,attempts,invalid_moves,won]=v.map(Number);return {pattern,seed,score,max_tile,valid_moves,attempts,invalid_moves,won};});}

function circular(p){const axis=d=>d==='0'||d==='3';return [...p].every((d,i)=>axis(d)!==axis(p[(i+1)%4]));}

function mean(a){return a.reduce((s,v)=>s+v,0)/a.length;}

function sd(a){const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));}

function quantile(a,p){const s=a.slice().sort((a,b)=>a-b),i=(s.length-1)*p,k=Math.floor(i);return s[k]+(s[Math.min(k+1,s.length-1)]-s[k])*(i-k);}

function logGamma(z){const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<0.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);z--;let x=.99999999999980993;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}

function betaCF(a,b,x){let c=1,d=1-(a+b)*x/(a+1);const tiny=1e-300; if(Math.abs(d)<tiny)d=tiny;d=1/d;let h=d;for(let m=1;m<=10000;m++){let m2=2*m,aa=m*(b-m)*x/((a-1+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;h*=d*c;aa=-(a+m)*(a+b+m)*x/((a+m2)*(a+1+m2));d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<3e-14)return h;}throw Error('beta did not converge');}

function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));return x<(a+1)/(a+b+2)?bt*betaCF(a,b,x)/a:1-bt*betaCF(b,a,1-x)/b;}

function paired(d){const n=d.length,m=mean(d),s=sd(d),se=s/Math.sqrt(n),t=m/se,critical=n===500?1.964729:n===600?1.963933:1.984217;const pos=d.filter(v=>v>0).length,neg=d.filter(v=>v<0).length,nt=pos+neg;return {n,mean_difference:m,sd_difference:s,ci95:[m-critical*se,m+critical*se],t,df:n-1,p_two_sided:ibeta((n-1)/(n-1+t*t),(n-1)/2,.5),cohen_dz:m/s,positive:pos,negative:neg,ties:n-nt,sign_p:nt?Math.min(1,2*ibeta(.5,Math.max(pos,neg),Math.min(pos,neg)+1)):1};}

function group(rows){const m=new Map();for(const r of rows){if(!m.has(r.seed))m.set(r.seed,[[],[]]);m.get(r.seed)[circular(r.pattern)?0:1].push(r);}return [...m.values()];}

function endpoints(rows){const gs=group(rows);const metrics={score:r=>r.score,valid_moves:r=>r.valid_moves,reach256:r=>+(r.max_tile>=256),reach512:r=>+(r.max_tile>=512),score_per_valid:r=>r.score/r.valid_moves,invalid_fraction:r=>r.invalid_moves/r.attempts};const out={};for(const [k,f] of Object.entries(metrics)){const A=gs.map(([a])=>mean(a.map(f))),B=gs.map(([,b])=>mean(b.map(f)));out[k]={circular:mean(A),other:mean(B),...paired(A.map((v,i)=>v-B[i]))};}const ks=Object.keys(out).sort((a,b)=>out[a].p_two_sided-out[b].p_two_sided);let max=0;ks.forEach((k,i)=>{max=Math.max(max,Math.min(1,out[k].p_two_sided*(ks.length-i)));out[k].holm_p=max;});return out;}

function describe(rows){return [true,false].map(c=>{const g=rows.filter(r=>circular(r.pattern)===c),s=g.map(r=>r.score),m=g.map(r=>r.valid_moves),by={};for(const r of g)by[r.max_tile]=(by[r.max_tile]||0)+1;return {class:c?'circular':'other',n:g.length,score_mean:mean(s),score_sd:sd(s),score_quantiles:[0,.1,.25,.5,.75,.9,.95,.99,1].map(p=>[p,quantile(s,p)]),moves_quantiles:[.1,.25,.5,.75,.9,.99].map(p=>[p,quantile(m,p)]),tiles:by,invalid_rate:g.reduce((a,r)=>a+r.invalid_moves,0)/g.reduce((a,r)=>a+r.attempts,0),pooled_score_per_move:g.reduce((a,r)=>a+r.score,0)/g.reduce((a,r)=>a+r.valid_moves,0)};});}

function mechanism(E,rows){const dirs=['up','left','right','down'],axis=d=>d===0||d===3;const agg=new Map(), perSeed=new Map();for(const r of rows){const rng=E.seededRng(r.seed);let state=E.createGame(rng);const c=circular(r.pattern)?'circular':'other';if(!perSeed.has(r.seed))perSeed.set(r.seed,{circular:[],other:[]});let totalMerges=0,emptySum=0,score=0;
 for(let i=0;i<12;i++){if(state.over)throw Error('Unexpected early termination');const d=+r.pattern[i%4],prev=i?+r.pattern[(i-1)%4]:null;const type=i===0?'initial':axis(d)===axis(prev)?'reverse':'turn';const prior=E.emptyCells(state.board).length;const next=E.step(state,dirs[d],rng);const changed=next!==state;const empty=E.emptyCells(next.board).length;const merges=empty-prior+(changed?1:0);const gain=next.score-state.score;if(merges<0)throw Error('negative merges');totalMerges+=merges;emptySum+=empty;score+=gain;const key=c+'|'+type;const x=agg.get(key)||{class:c,transition:type,n:0,changed:0,merges:0,gain:0,empty_after:0};x.n++;x.changed+=+changed;x.merges+=merges;x.gain+=gain;x.empty_after+=empty;agg.set(key,x);state=next;}
 perSeed.get(r.seed)[c].push({merges:totalMerges,mean_empty:emptySum/12,score});
 }
 const pairedEarly={};for(const k of ['merges','mean_empty','score']){const a=[...perSeed.values()].map(x=>mean(x.circular.map(y=>y[k])));const b=[...perSeed.values()].map(x=>mean(x.other.map(y=>y[k])));pairedEarly[k]={circular:mean(a),other:mean(b),...paired(a.map((v,i)=>v-b[i]))};}
 return {horizon:12,transition:[...agg.values()].map(x=>({...x,changed_rate:x.changed/x.n,merges_per_attempt:x.merges/x.n,gain_per_attempt:x.gain/x.n,mean_empty_after:x.empty_after/x.n})),paired_early:pairedEarly};}

function analyze(E,old,fresh){const combined=old.concat(fresh),keys=new Set(combined.map(r=>r.pattern+':'+r.seed));if(keys.size!==14400||combined.length!==14400||combined.some(r=>r.attempts!==r.valid_moves+r.invalid_moves))throw Error('dataset integrity');for(const [a,b] of group(combined))if(a.length!==8||b.length!==16)throw Error('unbalanced');const mechanisms=mechanism(E,fresh);return {fresh:endpoints(fresh),combined:endpoints(combined),original:endpoints(old),distribution:describe(combined),fresh_distribution:describe(fresh),mechanisms,zero_win_upper_95_per_pattern_fresh:1-Math.pow(.05,1/500),zero_win_upper_95_per_pattern_combined:1-Math.pow(.05,1/600),zero_win_upper_95_seed_block_combined:1-Math.pow(.05,1/600)};}

const old=parse(fs.readFileSync(path.join(__dirname,'../01-cyclic-permutations/games.csv'),'utf8'));
const fresh=parse(fs.readFileSync(path.join(__dirname,'games.csv'),'utf8'));
const out=analyze(E,old,fresh);
fs.writeFileSync(path.join(__dirname,'statistics.json'),JSON.stringify(out,null,2)+'\n');

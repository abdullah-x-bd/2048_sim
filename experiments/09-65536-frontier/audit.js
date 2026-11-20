'use strict';
function audit(F,C,contents){const [h,...lines]=contents.trim().split('\n'),keys=h.split(','),layouts=C.layouts();let n=0,wins=0,moves=0;for(const line of lines){const cols=line.split(','),r=Object.fromEntries(keys.map((k,i)=>[k,cols[i]])),seed=+r.seed,rng=F.init(seed).rng,path=layouts[+r.layout];let board,next=new Uint8Array(16);
 if(r.start!==undefined){board=new Uint8Array(16);for(let j=15;j>=+r.low;j--)board[path[15-j]]=j;F.spawn(board,rng);F.spawn(board,rng);if(Array.from(board).join('.')!==r.start)throw Error('initial mismatch '+seed);}
 else board=C.boardFromPath(path);
 const trace=r.trace||"";if(trace.length!==+r.moves)throw Error("length mismatch "+seed);for(const ch of trace){if(F.move(board,+ch,next)<0)throw Error("illegal move "+seed);[board,next]=[next,board];F.spawn(board,rng);}
 if(2**Math.max(...board)!==+r.tile||Number(board.includes(16))!==+r.won)throw Error("outcome mismatch "+seed);
 n++;wins+=+r.won;moves+=trace.length;}
 return {n,wins,moves};}
module.exports=audit;

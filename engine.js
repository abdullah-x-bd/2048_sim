'use strict';
// Pure 2048 mechanics; no DOM or external dependencies.

function mergeLine(line) {
  const tiles = line.filter(Boolean), result = [];
  let gain = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i+1]) {
      const value = tiles[i] * 2;
      result.push(value); gain += value; i++;
    } else result.push(tiles[i]);
  }
  while (result.length < line.length) result.push(0);
  return {line: result, gain};
}

function move(board, direction) {
  if (!['up','down','left','right'].includes(direction)) throw new Error('Invalid direction');
  const n=board.length, next=board.map(row=>row.slice());
  const vertical=direction==='up'||direction==='down', reverse=direction==='right'||direction==='down';
  let gain=0;
  for(let k=0;k<n;k++){
    const coords=Array.from({length:n},(_,i)=>{
      const j=reverse?n-1-i:i; return vertical?[j,k]:[k,j];
    });
    const merged=mergeLine(coords.map(([r,c])=>board[r][c]));
    gain+=merged.gain;
    coords.forEach(([r,c],i)=>{next[r][c]=merged.line[i];});
  }
  return {board:next,gain,changed:next.some((row,r)=>row.some((v,c)=>v!==board[r][c]))};
}

function emptyCells(board){
  const cells=[]; board.forEach((row,r)=>row.forEach((v,c)=>{if(v===0)cells.push([r,c]);})); return cells;
}

function spawnOutcomes(board) {
  const cells=emptyCells(board);
  return cells.flatMap(([r,c])=>[2,4].map(value=>{
    const next=board.map(row=>row.slice()); next[r][c]=value;
    return {board:next, tile:{row:r,col:c,value}, probability:(value===2?0.9:0.1)/cells.length};
  }));
}

function spawn(board,rng=Math.random) {
  const cells=emptyCells(board), next=board.map(row=>row.slice());
  if(!cells.length)return {board:next,tile:null};
  const [r,c]=cells[Math.floor(rng()*cells.length)],value=rng()<0.9?2:4;
  next[r][c]=value; return {board:next,tile:{row:r,col:c,value}};
}

function legalMoves(board){return ['up','down','left','right'].filter(direction=>move(board,direction).changed);}

function maxTile(board){return Math.max(...board.flat());}

function createGame(rng=Math.random){
  const empty=Array.from({length:4},()=>Array(4).fill(0));
  const board=spawn(spawn(empty,rng).board,rng).board;
  return {board,score:0,moves:0,won:false,over:false,lastSpawn:null};
}

function step(state,direction,rng=Math.random){
  const result=move(state.board,direction);
  if(!result.changed)return state;
  const spawned=spawn(result.board,rng),board=spawned.board;
  return {board,score:state.score+result.gain,moves:state.moves+1,won:state.won||maxTile(board)>=2048,over:legalMoves(board).length===0,lastSpawn:spawned.tile};
}

function seededRng(seed){
  let state=seed>>>0;
  return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}

const Engine = {mergeLine, move, emptyCells, spawnOutcomes, spawn, legalMoves, maxTile, createGame, step, seededRng};
if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
else globalThis.Engine2048 = Engine;

'use strict';
const assert = require('node:assert/strict');
const E = require('./engine.js');
const blank = () => Array.from({length:4},()=>[0,0,0,0]);
assert.deepEqual(E.mergeLine([2,2,2,2]),{line:[4,4,0,0],gain:8});
assert.deepEqual(E.mergeLine([2,2,4,0]),{line:[4,4,0,0],gain:4});
assert.deepEqual(E.mergeLine([2,0,2,4]),{line:[4,4,0,0],gain:4});
assert.deepEqual(E.mergeLine([2,2,2,0]),{line:[4,2,0,0],gain:4});
const board=[[2,0,0,0],[2,0,0,0],[4,0,0,0],[4,0,0,0]];
assert.deepEqual(E.move(board,'up').board,[[4,0,0,0],[8,0,0,0],[0,0,0,0],[0,0,0,0]]);
assert.deepEqual(E.move(board,'down').board,[[0,0,0,0],[0,0,0,0],[4,0,0,0],[8,0,0,0]]);
assert.deepEqual(E.move([[2,2,4,4],...blank().slice(1)],'right').board[0],[0,0,4,8]);
assert.deepEqual(E.move([[2,2,4,4],...blank().slice(1)],'left').board[0],[4,8,0,0]);
assert.equal(E.move(board,'up').gain,12);
assert.deepEqual(board,[[2,0,0,0],[2,0,0,0],[4,0,0,0],[4,0,0,0]]);
const terminal=[[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]];
assert.deepEqual(E.legalMoves(terminal),[]);
const outcomes=E.spawnOutcomes(board);
assert.equal(outcomes.length,24);
assert.ok(Math.abs(outcomes.reduce((s,o)=>s+o.probability,0)-1)<1e-12);
assert.ok(Math.abs(outcomes.filter(o=>o.tile.value===2).reduce((s,o)=>s+o.probability,0)-0.9)<1e-12);
assert.deepEqual(E.spawnOutcomes(terminal),[]);
const fixed={board:[[2,0,0,0],...blank().slice(1)],score:0,moves:0,won:false,over:false};
assert.equal(E.step(fixed,'left',()=>{throw Error('invalid move consumed RNG');}),fixed);
const near={...fixed,board:[[1024,1024,0,0],...blank().slice(1)]};
const won=E.step(near,'left',()=>0);
assert.equal(won.won,true);assert.equal(won.score,2048);assert.equal(won.moves,1);assert.equal(won.over,false);
assert.deepEqual(E.createGame(E.seededRng(42)),E.createGame(E.seededRng(42)));
assert.equal(E.emptyCells(E.createGame(E.seededRng(42)).board).length,14);
const sum=b=>b.flat().reduce((a,v)=>a+v,0);
for(let seed=0;seed<20;seed++){
  const rng=E.seededRng(seed);let state=E.createGame(rng);
  while(!state.over){
    const dirs=E.legalMoves(state.board);
    assert.ok(dirs.length>0);assert.ok(state.moves<10000);
    const dir=dirs[Math.floor(rng()*dirs.length)],next=E.step(state,dir,rng);
    assert.ok([2,4].includes(sum(next.board)-sum(state.board)));
    assert.equal(next.score-state.score,E.move(state.board,dir).gain);
    assert.equal(next.moves,state.moves+1);state=next;
  }
  assert.equal(E.legalMoves(state.board).length,0);
}
console.log('All engine tests passed.');

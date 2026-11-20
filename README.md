# 2048 Simulation Lab

A dependency-free implementation of standard 2048, designed as a foundation for studying and comparing solution strategies.

## Play

Clone the repository and open `index.html` in a modern browser. No build or package installation is required.

```sh
git clone https://github.com/abdullah-x-bd/2048_sim.git
cd 2048_sim
```

Alternatively, serve it locally with `python -m http.server 8000`, then visit http://localhost:8000.

Use arrow keys, WASD, touch gestures or the on-screen controls. The game continues after reaching 2048, and ends only when no legal moves remain. The displayed seed can be entered again to reproduce a game with the same sequence of actions.

## Rules

- 4 by 4 board; two random tiles initially.
- A tile can merge at most once per move.
- Each successful merge adds the resulting tile value to the score.
- Every valid move spawns one tile in a uniformly sampled empty cell: 2 with probability 0.9, 4 with probability 0.1.
- Invalid moves do not spawn tiles or consume random numbers.

## Engine for future solver research

`engine.js` works in both Node.js (CommonJS) and the browser, independently of the UI. Boards are arrays of four rows, with zero denoting an empty cell. All state transitions leave their inputs unchanged.

| Function | Purpose |
| --- | --- |
| `move(board, direction)` | Deterministic afterstate, gain and changed flag, without spawning |
| `legalMoves(board)` | Enumerate legal actions |
| `spawnOutcomes(board)` | Enumerate all possible spawn boards with exact probability weights (floating-point representation) |
| `spawn(board, rng)` | Sample a random tile and position |
| `createGame(rng)` | Initialise a game |
| `step(state, direction, rng)` | Execute a full game transition |
| `seededRng(seed)` | Reproducible uniform pseudorandom sequence |
| `maxTile(board)` | Highest tile |

```js
const E = require('./engine.js');
const rng = E.seededRng(42);
let state = E.createGame(rng);
state = E.step(state, E.legalMoves(state.board)[0], rng);
console.log(state);
```

The engine separates player actions from random environment transitions, so expectimax, Monte Carlo methods, heuristic search and reinforcement learning can all use the same rules. The initial version contains no solver.

## Tests

With Node.js installed, run:

```sh
node engine.test.js
```

Tests cover the four movement directions, merging, score gains, spawn probabilities, invalid moves, winning, reproducibility, immutability and complete simulated games.

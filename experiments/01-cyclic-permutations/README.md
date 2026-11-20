# Experiment 01: fixed cyclic permutations

## Protocol

Directions: 0 = up, 1 = left, 2 = right, 3 = down. All 24 permutations of the four directions were repeated indefinitely until no legal move remained. Each pattern used the same 100 initial RNG seeds (0 through 99). Every input advances the cycle even if it changes nothing; such attempts are counted, consume no randomness and spawn no tile. The game continues past 2048 if reached. No board-dependent selection or skipping is allowed.

## Results

All 2400 games completed. No run reached 1024 or 2048. Highest tile: 512. Best score: 6812 (pattern 0231, seed 48). Mean score: 1478.34.

## Geometric symmetry

There are three circular orderings up to reversal and cyclic start if directions are individually labeled, but under square rotations and reflections the 24 ordered permutations fall into two geometric classes: 8 cycles alternating vertical and horizontal directions (clockwise or anticlockwise), and 16 other cycles containing opposite consecutive directions. The expected performance is equal within each class under the ideal rotation/reflection-invariant game distribution; observed sample differences do not establish superiority within a class. Fixed seeds are shared, but the row-major random-cell mapping is not equivariant under rotation/reflection, so equivalent patterns need not have identical seeded trajectories.

| Class | Games | Mean score | Mean valid moves | Reached 256+ | Reached 512+ |
|---|---:|---:|---:|---:|---:|
| Alternating axes | 800 | 2238.41 | 193.77 | 425 | 43 |
| Other | 1600 | 1098.30 | 119.33 | 105 | 0 |

The difference in score is 1140.12 points, with exploratory paired 95% t interval [1057.89, 1222.34], using the 100 seed-level class mean differences as observations, not treating the 2400 games as independent. The alternating group scores 2.04 times as high on average.

No wins were observed; that is not a proof of impossibility. These results come from one finite seed set. Pattern-level intervals in summary.csv are marginal, not corrected for multiple comparisons; within-class numerical rankings are descriptive only.

## Reproduce

Run `node experiments/01-cyclic-permutations/run.js` from the repository root.

- games.csv: one record per game, including invalid attempt counts.
- summary.csv: per-pattern statistics.

The initial dataset records attempted and invalid move counts per game, not a separate event-by-event trace. A subsequent trace file can preserve every individual attempted direction and whether it changed the board.

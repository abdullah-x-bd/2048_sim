# Experiment 04 pilot: human-followable rules

Objective: maximize the probability of producing a 2048 tile, subject to a small number of easily memorized rules, minimal visual inspection and no multi-step search. Mean final score is secondary. This pilot uses 1000 fresh shared seeds (2100 to 3099) per configuration: 18,000 games in 18 configurations, including two behaviorally equivalent priority configurations. It is exploratory, not a held-out confirmation of the selected winner.

## Results

| Configuration | Mean score | Reached 1024 | Reached 2048 |
|---|---:|---:|---:|
| fixed (0102) | 3892.436 | 1 | 0 |
| sweep_recover | 4665.732 | 11 | 0 |
| corner_recover | 2736.232 | 0 | 0 |
| priority | 2604.680 | 0 | 0 |
| up_sweep (same action rule as priority) | 2604.680 | 0 | 0 |
| big_merge_prefer_corner | 3077.740 | 1 | 0 |
| corner_big_merge | 3421.784 | 1 | 0 |
| edge_big_merge | 3037.732 | 1 | 0 |
| corner_most_merges | 3414.128 | 2 | 0 |
| most_merges | 3028.836 | 1 | 0 |
| corner_order | 3822.720 | 4 | 0 |
| corner_snake | 3662.432 | 28 | 0 |
| corner_snakemerge | 5562.312 | 110 | 2 |
| lock_top | 1499.416 | 0 | 0 |
| edge_first | 3009.988 | 1 | 0 |
| snake_weight | 2302.352 | 2 | 0 |
| snake_weight_space | 2818.480 | 5 | 0 |
| corner_order_merge | 3845.072 | 4 | 0 |

All counts are at least the given tile, not exclusive terminal tile frequencies. Each game continues until terminal except the blind fixed policy, which can stagnate.

The winning configuration is corner_snakemerge. It examines the four deterministic immediate afterstates (before random spawning), filters legal moves to those which place any maximum tile in the upper-left corner if one exists, maximizes the number of merges, then minimizes the sum of upward increases in tile exponents along a fixed snake path. Ties are broken by immediate score gain and then Up, Left, Right, Down. This is a one-step deterministic visual heuristic, not merely a blind sequence, and exact snake-penalty arithmetic is not intended as a human instruction. The human approximation has not been evaluated. Two successes out of 1000 are not reliable winning performance. The observed 0.2% rate is exploratory and subject to selection uncertainty.

First successful runs: seed 2725 (first 2048 on move 942, final score 23352) and seed 3097 (first 2048 on move 996, final score 27444). Both traces are in corner_snakemerge.csv.

The 0102 recovery configuration executes Down after four consecutive unchanged inputs, then resumes its sequence. It improves mean score without solving the game in this sample. The priority and up_sweep configurations execute the exact same directions, with differing recovery bookkeeping; they are not independent policies.

## Research direction

Test short conditional instructions that can be applied visually, rather than computing weighted values or simulating trees: protect the largest tile when possible; choose moves creating more free spaces; break ties by preserving descending tile order along a snake path; investigate staged rules focused on building the next matching large tile near the maximum tile. Test whether simplified human approximations retain performance. Measure win rate, probability of reaching intermediate tiles, number of rules/conditions, board inspection burden, and number of interventions. Select candidates on exploration seeds, then validate on disjoint seeds. Aim for high success rate, not merely isolated victories. No dependable human strategy has been found yet.

## Reproduce

From the repository root:
```sh
node experiments/04-simple-human-policies-pilot/run.js
node experiments/04-simple-human-policies-pilot/visual.js
```

summary.csv and visual-summary.csv contain the two groups of results; each policy CSV includes complete attempted-direction strings and metrics. The minimal-memory group includes one-based base-36 invalid attempt indices; the visual group selects legal actions from board inspection so actual attempted inputs are valid, and no hypothetical evaluations count as inputs. All summaries were regenerated identically before committing the raw files. Simulations use the optimized engine from experiment 03; no new browser testing or human playtesting was performed.

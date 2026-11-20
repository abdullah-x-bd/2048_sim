# Experiment 06: Literature-guided policy simplification

## Objective

Find a human-followable 2048 policy whose independent held-out win rate exceeds 50%, ideally with its 95% confidence interval entirely above 50%. Numerical AI benchmarks are comparison tools, not evidence that the human objective has been met. This experiment stops on the first 2048 tile or actual game over. All actual selected moves are legal. Hypothetical evaluations are not player inputs.

## Literature review

- Kohler, Migler & Khosmood (2019), [Composition of Basic Heuristics for the Game 2048](https://theresamigler.files.wordpress.com/2020/03/2048.pdf), FDG 2019. The closest precedent: ordered, tie-breaking heuristics intended for human use. The best mean in their table is 3947.83 for empty-space maximization followed by monotonicity and random tie-breaking. Their reported top-ten maximum scores are 12220 to 13248; the study reports scores rather than a 2048 win rate. This is an important prior result, so combining basic heuristics is not itself novel.
- Szubert & Jaskowski (2014), [Temporal Difference Learning of N-Tuple Networks for the Game 2048](https://mszubert.github.io/papers/Szubert_2014_CIG.pdf), IEEE CIG, DOI 10.1109/CIG.2014.6932907. Learned afterstate evaluation attained over 97% wins using one-ply action evaluation. This motivates approximating a good value function without deep search, but the learned network is not human-executable.
- Xiao et al., [2048-ai](https://github.com/nneonneo/2048-ai), open-source implementation. Uses expectimax and handcrafted positional evaluation, including empty cells, merge opportunities and monotonicity. Our reference variants use a similar feature family and explicitly vary the space reward; they are not a claim of exact reproduction of the upstream solver.
- Slizkov (2023), [Computational bounds for the 2048 game](https://arxiv.org/abs/2303.07266). Establishes a strategy with winning probability at least 0.99969 under the modeled standard game, and a guaranteed 256 strategy. This establishes feasibility, not human simplicity.
- [Optimistic Temporal Difference Learning for 2048](https://arxiv.org/abs/2111.11090) (2021 preprint; 2022 journal publication). Combining learned evaluation and search achieved mean score 625377 and 72% attainment of 32768. This makes solving standard 2048 with computational resources a well-established problem.

## Prior screening (Experiment 05)

26 configurations on 100 shared seeds each (3100 to 3199); zero wins. Three numerical reference policies on the same 100 seeds each: greedy 0%, deterministic two-move 0%, stochastic two-move 44%. Results are in ../05-human-rule-search/. The initial broad run that timed out is excluded from totals.

## Methods and results

### Simple rule screening

12 candidates (50 seeds each, 3300 to 3349), including empty-first and ordering-first policies, deterministic two-move evaluation and coarse weighted evaluations. The best, simple_combined, won 1/50. Some configurations are behaviorally equivalent (safe is redundant for evaluated legal afterstates). Treat the screening as exploratory.

### Numerical reference screening

Seven policies evaluated on those same 50 seeds each, varying empty-space weight, merge-potential weight, ordering penalty and use of stochastic versus deterministic lookahead.

| Policy | Wins | 2048 rate | Reached 1024 |
|---|---:|---:|---:|
| xiao_like | 21/50 | 42% | 41/50 |
| more_space | 31/50 | 62% | 48/50 |
| more_pairs | 15/50 | 30% | 38/50 |
| less_disorder | 12/50 | 24% | 39/50 |
| coarse_visual | 8/50 | 16% | 42/50 |
| coarse_large_order | 7/50 | 14% | 32/50 |
| coarse_large_order_det | 0/50 | 0% | 0/50 |

The more_space reference was selected and validated on 300 seeds (3400 to 3699), producing 147 wins (49%; Wilson 95% CI 43.39% to 54.63%). Selection on the small screening set overstated performance.

### Simplified-policy holdout

200 new shared seeds per policy (3700 to 3899).

| Policy | Wins | 2048 rate | Reached 1024 |
|---|---:|---:|---:|
| simple_combined | 1/200 | 0.5% | 89/200 |
| space_safe_2 | 0/200 | 0% | 94/200 |
| empty_order_2 | 0/200 | 0% | 84/200 |
| coarse_visual | 48/200 | 24% | 166/200 |

The coarse_visual policy scores row/column features (empty space, runs of equal nonzero tiles, and order), then averages over all possible next spawns and chooses the best following move for each. Despite coarse features it remains computational, not a tested human instruction.

### Stronger space-reward screening and final independent validation

100 new shared seeds per policy (3900 to 3999). Both space_810 and space_1080 achieved 69 wins. space_1080 was selected by the prespecified-in-this-run secondary metric of higher 1024 attainment (96 vs 88); this selection is exploratory. We evaluated the selected policy on another 300 fresh seeds (4000 to 4299).

**220/300 wins (73.33%), Wilson two-sided 95% CI [68.06%, 78.02%].** 287/300 reached at least 1024; mean score at win or terminal 19869.56; mean moves 1009.75. This is the first independent benchmark in this project to exceed the 50% threshold with its entire confidence interval above 50%. It is NOT the final human policy.

The weighted evaluator uses row and column features: 1080 points per empty cell occurrence, 700 per tile counted in adjacent equal-value runs (zeros skipped), a monotonicity penalty weighing fourth powers of tile exponents, and a tile-rank sum penalty weighing exponent powers of 3.5. Coefficients of the penalties are 47 and 11 respectively. Empty cells are counted in both row and column evaluation. For each immediate action, the evaluator considers all possible next spawns, with the standard 90/10 probabilities, and the best next legal move. It combines 10% immediate value and 90% expected following value. See references.js and adaptive-depth.js for the exact implementation. The space_1080 policy uses threshold 0; it does not activate the extra-depth case in normal preterminal boards with empty cells, but it DOES activate the extra-depth branch on a full board (zero empty cells). Therefore its reported performance is for this exact adaptive implementation, not necessarily pure uniform two-move search. Future ablation should explicitly disable the zero-empty extra-depth branch to isolate the space-weight effect.

## Interpretation

The main evidence is that preserving room and considering near-future board resilience are promising. The numerical weight comparisons alone do not establish a causal human rule; configurations differ in behavior because evaluation and planning interact. Strong fixed/lexicographic policies have been ineffective. Before claiming a human strategy, we need to translate benchmark decisions into visual cues, test them independently, and ideally test actual human adherence.

Next direction: harvest benchmark and failed-policy decisions on the same board states; examine differences in safe next moves, available merge directions, large-tile adjacency, and free-space distribution. Fit or manually derive a short decision list with boolean cues, then evaluate its *closed-loop* win rate on entirely new seeds. Agreement with benchmark actions is only a proxy and must not replace win-rate evaluation. A practical candidate may ask players to keep at least two useful directions available, avoid breaking large-tile chains, and check whether an awkward next spawn would spoil their next merge. These rules are hypotheses, not validated strategies.

## Reproducibility

Run from repo root: node experiments/06-literature-guided/run.js. Uses engine.js and experiment 03's validated fast engine. All 2550 completed game outcomes and action traces are saved; 600 simple screening games, 350 reference screening games, 300 more_space holdout games, 800 simplified holdout games, 200 higher-space screening games and 300 selected-reference holdout games. Seed blocks are shared across compared policies; cross-policy results are correlated. Wilson intervals apply to a single fixed policy across its seed block, under the independent-seed approximation.

The crowd-triggered deeper-search screening exceeded execution limits before results were saved. Code is retained in adaptive-depth.js; no unfinished games are counted. The earlier zero-win 26-policy screen in Experiment 05 retains aggregate results and reproducible code, not all individual traces. No human playtest has been performed.

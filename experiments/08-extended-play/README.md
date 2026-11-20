# Experiment 08: extended play and the majority-success ceiling

Standard 4x4 rules: two starting tiles, independent random spawn values (2 with probability 0.9, 4 with probability 0.1), uniform empty-cell locations, no undo or foreknowledge of RNG.

## Absolute upper bound for 131072

Let S be total board value. Merges preserve S; spawns increase it by 2 or 4. At S=131070 the binary representation has sixteen distinct powers of two (2 through 65536). A representation with at most sixteen positive powers of two must be exactly those distinct tiles, since carrying equal powers reduces term count. Such a board is full and has no legal move. Reaching 131072 therefore requires skipping 131070 by spawning a 4 when S=131068. The conditional probability is at most 0.1.

For a sharper bound, presample independent spawn values, starting from zero and counting the initial two spawns. In units of two the increments are 1 (0.9) or 2 (0.1). The infinite stream's probability u(n) of hitting n obeys u(0)=1, u(1)=0.9, u(n)=0.9u(n-1)+0.1u(n-2), giving u(n)=10/11+(-0.1)^n/11. Any successful actual game must hit 65534 and immediately increment by two. Thus P(reach 131072) <= 0.1u(65534) = 1/11 + 0.1^65534/110, approximately 9.09%. This upper bound ignores spatial restrictions and other ways to lose. It is not an estimate of achievable performance.

The binary-mass argument is prior art (https://puzzling.stackexchange.com/questions/48/what-is-the-largest-tile-possible-in-2048); no novelty is claimed for this proof without a more comprehensive review.

## Highest tile with majority success

32768 is demonstrated: https://github.com/game-difficulty/2048EndgameTablebase reports 86.1% at 32768 and 8.4% at 65536 over 1200 no-undo games. Peer-reviewed research also reports 72% reaching 32768 (https://arxiv.org/abs/2111.11090). These are solver-specific empirical results, not optimal-probability bounds. Since 131072 is ruled out at 50%, the optimal majority-success tile is either 32768 or 65536; deciding between them is unresolved in the sources consulted. A verified 65536 majority policy or an impossibility theorem would be a substantial advance.

## Completed extended-play pilot

Eight games with third-action lookahead only on full boards (threshold 0) and four paired games with third-action lookahead at two or fewer empty cells (threshold 2). All legal moves and both spawn values/locations are evaluated at searched chance levels, with heuristic leaves; this is not an exhaustive full-game tree. The games continue until game over. The 12 saved configurations reached at most 4096, with a maximum score of 62108 (threshold 2, seed 6003). The tiny pilot is not a state-of-the-art benchmark. All completed verified traces are saved in games.csv and deeper-games.csv. Reproduce with node experiments/08-extended-play/run.js. No human playtesting or independent reproduction of external solvers.

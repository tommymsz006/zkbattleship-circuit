# ZK-Battleship

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

This fork of `zkbattleship-circuit` uses a zkSNARK arithmetic circuit implementation by [tommymsz006](https://github.com/tommymsz006/zkbattleship), a prototype [Battleship](https://en.wikipedia.org/wiki/Battleship_(game)) game built on zkSNARKs proof and verification. It is being updated for 2022 and work is in progress.

1. run POT15 ceremony (@todo rename old pot12 naming)
```
yarn setup:ptau
```
2. run zkey and verification key compilation and export
```
yarn setup:circuits
```
3. VERY JANKY: 
  a. manually rename Verifier -> BoardVerifier in contracts/BoardVerifier.sol, change `solidity pragma 0.8.6`;
  b. manually rename Verifier -> ShotVerifier in contracts/ShotVerifier.sol, change `solidity pragma 0.8.6`;
4. test on-chain locally
```
npx hardhat test
```
- [x] board creation proof
- [x] hit/miss proof
- [x] base case unit testing on-chain
- [ ] full unit testing-chain
- [ ] incremental merkle proof to rollup game in one on-chain tx

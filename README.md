# zkbattleship-circuit

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

`zkbattleship-circuit` consists of the zkSNARKs arithmetic circuit implementation for [zkbattleship](https://github.com/tommymsz006/zkbattleship), a prototype [Battleship](https://en.wikipedia.org/wiki/Battleship_(game)) game built on zkSNARKs proof and verification.

Currently it has the circuit implementations in [ZoKrates](https://github.com/Zokrates/ZoKrates) (which can generate verifier in form of Ethereum smart contract), as well as [circom](https://github.com/iden3/circom) (which can then be used with [snarkjs](https://github.com/iden3/snarkjs)).

## Prerequisite

For [ZoKrates](https://github.com/Zokrates/ZoKrates), install ZoKrates CLI locally per the instruction at [here](https://zokrates.github.io/gettingstarted.html). This allows the use of zokrates in command prompt.

For [circom](https://github.com/iden3/circom), install `circomlib` via npm:

```bash
npm install circomlib@0.0.16
```

The above will also install `snarkjs` as a dependency. Alternatively, install `snarkjs` via npm:

```bash
npm install snarkjs@0.1.18
```

Notice that the current implementation is not yet compatible with `circom` v0.5, which was released in March 2020.

## Structure

`zokrates` and `circom` subfolders hold the implementation for [ZoKrates](https://github.com/Zokrates/ZoKrates) and [circom](https://github.com/iden3/circom) respectively.

## Build

You may find the basics of the lifecycle of zkSNARKs proof and verification [here](https://medium.com/@tommy.msz006/applying-zk-snarks-in-practice-dcecf250adc8?source=friends_link&sk=12836f9e0fd2925df203f5df69dc21db).

Both Pedersen (see more at [ethresear.ch](https://ethresear.ch/t/cheap-hash-functions-for-zksnark-merkle-tree-proofs-which-can-be-calculated-on-chain/3176) and [Zcash](https://github.com/zcash/zcash/issues/2234)) and SHA256 hash implementations are available, you may choose the ones that you need to compile.

Pedersen hash implementation is recommended for zkSNARKs efficiency.

For [ZoKrates](https://github.com/Zokrates/ZoKrates):

```bash
cd zokrates

# Pedersen:
# compile circuit code and generate out, proving.key and verifier.sol
./zkcompile code/battleship_pedersen.code
# calculate sample witness and generate proof (proof.json)
./zkprove_pedersen

# SHA256 (not recommended):
# compile circuit code and generate out, proving.key and verifier.sol
./zkcompile code/battleship_sha256.code
# calculate sample witness and generate proof.json
./zkprove_sha256
```

For [circom](https://github.com/iden3/circom):

```bash
cd circom

# Pedersen:
# compile circuit code and generate circuit.json, proving_key.json, verification_key.json and verifier.sol
./zkcompile battleship_pedersen.circom
# calculate sample witness (input.json) and generate proof (proof.json and public.json)
./zkprove

# SHA256 (not recommended):
# compile circuit code and generate circuit.json, proving_key.json, verification_key.json and verifier.sol
./zkcompile code/battleship_sha256.code
# calculate sample witness (input.json) and generate proof.json and public.json
./zkprove
```

The keys generated from above can be used to prove and verify respectively (e.g. to be used in snarkjs for circom). `verifier.sol`, which is the generated smart contract in Solidity, can be deployed on Ethereum blockchain for decentralized verification (see section below).

In particular, [zkbattleship](https://github.com/tommymsz006/zkbattleship) uses circom implementation to perform on-demand proof generation (using `circuit.json` and `proving_key.json`), local verification (`verification_key.json`) as well as Web3 verification (`verifier.sol`).

## Contract Deployment

Assume that a Ganache local development blockchain is up and running:

```bash
# start Ganache as local Ethereum blockchain at the background
ganache-cli
```

Verifier contract (`verifier.sol`) can be deployed to the network using `truffle`:

```bash
cd contracts

# softlink to verifier.sol generated either by ZoKrates or circom
# circom's one is required for zkbattleship
ln -s ../zokrates/verifier.sol
ln -s ../circom/verifier.sol

# compile contract and deploy
truffle compile
truffle migrate
```

See more details around [ganache-cli](https://github.com/trufflesuite/ganache-cli) and [truffle](https://www.trufflesuite.com/truffle).

`truffle-config.js` is in its basic configuration for local development. Additional networks (e.g. Kovan testnet) can be manually configured there.
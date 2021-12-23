#!/bin/bash

# exit when any command fails
set -e

# compile circuit
circom battleship_pedersen.circom --r1cs --wasm
# powers of tau
mkdir tau && mkdir zkey && cd tau
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute  pot12_0000.ptau pot12_0001.ptau --name="Contribution"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
snarkjs groth16 setup ../battleship_pedersen.r1cs pot12_final.ptau ../zkey/battleship_pedersen_0000.zkey
snarkjs zkey contribute ../zkey/battleship_pedersen_0000.zkey ../zkey/battleship_pedersen_0001.zkey --name="Name" -v
snarkjs zkey export verificationkey ../zkey/battleship_pedersen_0001.zkey ../verification_key.json
# export to solidity
snarkjs zkey export solidityverifier ../zkey/battleship_pedersen_0001.zkey ../../contracts/Verifier.sol

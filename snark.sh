#!/bin/bash

# exit when any command fails
set -e
# powers of tau (REAL SETUP)
snarkjs powersoftau new bn128 12 ./circom/pot12_0000.ptau -v
snarkjs powersoftau contribute ./circom/pot12_0000.ptau ./circom/pot12_0001.ptau \
    --name="Contribution"    -e="$(head -n 4096 /dev/urandom | openssl sha1)"
snarkjs powersoftau verify ./circom/pot12_0001.ptau
snarkjs powersoftau prepare phase2 ./circom/pot12_0001.ptau ./circom/pot12_final.ptau \
    -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
snarkjs powersoftau verify ./circom/pot12_final.ptau
# PROVE
## compile circuit
circom --r1cs --wasm --output ./circom ./circom/battleship_pedersen.circom
## compile witness
node ./circom/battleship_pedersen_js/generate_witness.js ./circom/battleship_pedersen_js/battleship_pedersen.wasm \
    ./circom/input.json ./circom/witness.wtns
## setup groth16
snarkjs groth16 setup ./circom/battleship_pedersen.r1cs ./circom/pot12_final.ptau \
    ./circom/zkey/circuit_0000.zkey
snarkjs zkey contribute ./circom/zkey/circuit_0000.zkey ./circom/zkey/circuit_final.zkey --name="Name" \
    -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
snarkjs zkey export verificationkey ./circom/zkey/circuit_final.zkey ./circom/verification_key.json
snarkjs groth16 prove ./circom/zkey/circuit_final.zkey ./circom/witness.wtns \
    ./circom/proof/public.json ./circom/proof/proof.json
snarkjs groth16 verify ./circom/verification_key.json ./circom/proof/public.json ./circom/proof/proof.json

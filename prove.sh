#!/bin/sh
set -e

# --------------------------------------------------------------------------------
# Phase 2
# ... circuit-specific stuff

# Compile the circuit. Creates the files:
# - circuit.r1cs: the r1cs constraint system of the circuit in binary format
# - battleship_js folder: wasm and witness tools
# - circuit.sym: a symbols file required for debugging and printing the constraint system in an annotated mode
circom ./circom/battleship.circom -o ./circom --r1cs --wasm --sym
echo x
# Optional - view circuit state info
snarkjs r1cs info ./circom/battleship.r1cs

# Optional - print the constraints
snarkjs r1cs print ./circom/battleship.r1cs ./circom/battleship.sym

# Optional - export the r1cs
# yarn snarkjs r1cs export json ./zk/circuit.r1cs ./zk/circuit.r1cs.json && cat circuit.r1cs.json
# or...
# yarn zk:export-r1cs

# Generate witness
node ./circom/battleship_js/generate_witness.js ./circom/battleship_js/battleship.wasm \
    ./circom/input.json ./circom/witness.wtns

# Setup (use plonk so we can skip ptau phase 2
snarkjs groth16 setup ./circom/battleship.r1cs ./circom/ptau/pot12_final.ptau ./circom/zkey/battleship_final.zkey

# Generate reference zkey
snarkjs zkey new ./circom/battleship.r1cs ./circom/ptau/pot12_final.ptau ./circom/zkey/battleship_0000.zkey

# Ceremony just like before but for zkey this time
snarkjs zkey contribute ./circom/zkey/battleship_0000.zkey ./circom/zkey/battleship_0001.zkey \
    --name="First contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute ./circom/zkey/battleship_0001.zkey ./circom/zkey/battleship_0002.zkey \
    --name="Second contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute ./circom/zkey/battleship_0002.zkey ./circom/zkey/battleship_0003.zkey \
    --name="Third contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"

#  Verify zkey
snarkjs zkey verify ./circom/battleship.r1cs ./circom/ptau/pot12_final.ptau ./circom/zkey/battleship_0003.zkey

# Apply random beacon as before
snarkjs zkey beacon ./circom/zkey/battleship_0003.zkey ./circom/zkey/battleship_final.zkey \
    0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"

# Optional: verify final zkey
snarkjs zkey verify ./circom/battleship.r1cs ./circom/ptau/pot12_final.ptau ./circom/zkey/battleship_final.zkey

# Export verification key
snarkjs zkey export verificationkey ./circom/zkey/battleship_final.zkey ./circom/verification_key.json

# Create the proof
snarkjs groth16 prove ./circom/zkey/battleship_final.zkey ./circom/witness.wtns \
    ./circom/proof/proof.json ./circom/proof/public.json

# Verify the proof
snarkjs groth16 verify ./circom/verification_key.json ./circom/proof/public.json ./circom/proof/proof.json

# Export the verifier as a smart contract
snarkjs zkey export solidityverifier ./circom/zkey/battleship_final.zkey ./contracts/Verifier.sol

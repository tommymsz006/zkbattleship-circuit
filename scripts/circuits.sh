#!/bin/sh
set -e

# --------------------------------------------------------------------------------
# Phase 2
# ... circuit-specific stuff

# if zk/zkey does not exist, make folder
[ -d zk/zkey ] || mkdir zk/zkey

# Compile circuits
circom zk/circuits/board.circom -o zk/ --r1cs --wasm
circom zk/circuits/shot.circom -o zk/ --r1cs --wasm

#Setup
yarn snarkjs groth16 setup zk/board.r1cs zk/ptau/pot15_final.ptau zk/zkey/board_final.zkey
yarn snarkjs groth16 setup zk/shot.r1cs zk/ptau/pot15_final.ptau zk/zkey/shot_final.zkey

# # Generate reference zkey
yarn snarkjs zkey new zk/board.r1cs zk/ptau/pot15_final.ptau zk/zkey/board_0000.zkey
yarn snarkjs zkey new zk/shot.r1cs zk/ptau/pot15_final.ptau zk/zkey/shot_0000.zkey

# # Ceremony just like before but for zkey this time
yarn snarkjs zkey contribute zk/zkey/board_0000.zkey zk/zkey/board_0001.zkey \
    --name="First board contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute zk/zkey/shot_0000.zkey zk/zkey/shot_0001.zkey \
    --name="First shot contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute zk/zkey/board_0001.zkey zk/zkey/board_0002.zkey \
    --name="Second board contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute zk/zkey/shot_0001.zkey zk/zkey/shot_0002.zkey \
    --name="Second shot contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute zk/zkey/board_0002.zkey zk/zkey/board_0003.zkey \
    --name="Third board contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"
yarn snarkjs zkey contribute zk/zkey/shot_0002.zkey zk/zkey/shot_0003.zkey \
    --name="Third shot contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"

# #  Verify zkey
yarn snarkjs zkey verify zk/board.r1cs zk/ptau/pot15_final.ptau zk/zkey/board_0003.zkey
yarn snarkjs zkey verify zk/shot.r1cs zk/ptau/pot15_final.ptau zk/zkey/shot_0003.zkey

# # Apply random beacon as before
yarn snarkjs zkey beacon zk/zkey/board_0003.zkey zk/zkey/board_final.zkey \
    0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Board FinalBeacon phase2"

yarn snarkjs zkey beacon zk/zkey/shot_0003.zkey zk/zkey/shot_final.zkey \
    0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Shot Final Beacon phase2"

# # Optional: verify final zkey
yarn snarkjs zkey verify zk/board.r1cs zk/ptau/pot15_final.ptau zk/zkey/board_final.zkey
yarn snarkjs zkey verify zk/shot.r1cs zk/ptau/pot15_final.ptau zk/zkey/shot_final.zkey

# # Export verification key
yarn snarkjs zkey export verificationkey zk/zkey/board_final.zkey zk/board_verification_key.json
yarn snarkjs zkey export verificationkey zk/zkey/shot_final.zkey zk/shot_verification_key.json

# Export board verifier with updated name and solidity version
snarkjs zkey export solidityverifier zk/zkey/board_final.zkey contracts/BoardVerifier.sol
sed -i 's/0.6.11;/0.8.11;/g' contracts/BoardVerifier.sol
sed -i 's/contract Verifier/contract BoardVerifier/g' contracts/BoardVerifier.sol

# Export shot verifier with updated name and solidity version
snarkjs zkey export solidityverifier zk/zkey/shot_final.zkey contracts/ShotVerifier.sol
sed -i'' 's/0.6.11;/0.8.11;/g' contracts/ShotVerifier.sol
sed -i'' 's/contract Verifier/contract ShotVerifier/g' contracts/ShotVerifier.sol
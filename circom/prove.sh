#!/bin/bash

# exit when any command fails
set -e
# compute witness
cd battleship_pedersen_js
node generate_witness.js battleship_pedersen.wasm ../input.json ../witness.wtns
cd ..
# create proof
mkdir proof
snarkjs groth16 prove ./zkey/battleship_pedersen_0001.zkey witness.wtns ./proof/public.json ./proof/proof.json
# local validity check
snarkjs groth16 verify verification_key.json ./proof/public.json ./proof/proof.json
#!/bin/sh
set -e

# compile board witness
node zk/board_js/generate_witness.js zk/board_js/board.wasm zk/inputs/boardOk1.json zk/witnesses/board1.wtns

# create proof
yarn snarkjs groth16 prove zk/zkey/board_final.zkey zk/witnesses/board1.wtns \
    zk/proof/board1_proof.json zk/proof/board1_public.json

#verify proof locally
yarn snarkjs groth16 verify zk/board_verification_key.json zk/proof/board1_public.json zk/proof/board1_proof.json
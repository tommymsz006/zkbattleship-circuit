#!/bin/bash

# If !yes exit
read -r -p "Are you sure? [y/N] " response
case "$response" in
    [yY][eE][sS]|[yY]) 
        rm -rf proof tau zkey battleship_pedersen_js verification_key.json witness.wtns battleship_pedersen.r1cs
        echo "Circom build artifacts removed"
        ;;
    *)
        echo "ABORT"
        ;;
esac

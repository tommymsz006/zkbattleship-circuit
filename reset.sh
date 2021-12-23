#!/bin/bash

# If !yes exit
read -r -p "Are you sure? [y/N] " response
case "$response" in
    [yY][eE][sS]|[yY]) 
        rm ./circom/proof/* ./circom/zkey/* ./circom/*.r1cs ./circom/pot12* \
            ./circom/verification_key.json ./circom/witness.wtns
        echo "Circom build artifacts removed"
        ;;
    *)
        echo "ABORT"
        ;;
esac

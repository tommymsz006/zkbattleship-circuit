#!/bin/bash

# If !yes exit
read -r -p "Are you sure? [y/N] " response
case "$response" in
    [yY][eE][sS]|[yY])
        rm ./circom/proof/* ./circom/zkey/* ./circom/*.r1cs ./circom/*.sym \
        ./circom/verification_key.json ./circom/witness.wtns
        rm -rf ./circom/battleship_js
        # Don't delete ptau generation
        read -r -p "Remove *.ptau? [y/N] " response2
        case "$response2" in
            [yY][eE][sS]|[yY])
                rm ./circom/ptau/* 
                echo "Circom, PTAU build artifacts removed"
            ;;
            *)
                echo "Circom build artifacts removed"
            ;;
        esac
    ;;
    *)
        echo "ABORT"
    ;;
esac

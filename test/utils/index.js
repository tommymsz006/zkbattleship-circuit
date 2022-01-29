const fs = require('fs')
const builder = require('./wc')

module.exports = {
    buildArgs,
    genWtns
}

/**
 * Build contract call args
 * @dev 'massage' circom's proof args into format parsable by solidity
 * 
 * @param {*} proof 
 * @param {*} publicSignals 
 * @returns 
 */
function buildArgs(proof, publicSignals) {
    return [
        proof.pi_a.slice(0, 2), // pi_a
        // genZKSnarkProof reverses values in the inner arrays of pi_b
        [
            proof.pi_b[0].slice(0).reverse(),
            proof.pi_b[1].slice(0).reverse(),
        ], // pi_b
        proof.pi_c.slice(0, 2), // pi_c
        publicSignals, // input
    ]
}

/**
 * Given inputs and circuit wasm, generate a .wtns file
 * 
 * @param {Object} input - the proof inputs used to calculate witness
 * @param {string} wasmFilePath - path to circuit wasm file
 * @param {string} witnessFileName - path/ file name to save .wtns at
 * @returns 
 */
async function genWtns(input, wasmFilePath, witnessFileName) {
    const buffer = fs.readFileSync(wasmFilePath)
    return new Promise((resolve, reject) => {
        builder(buffer)
            .then(async (witnessCalculator) => {
                const buff = await witnessCalculator.calculateWTNSBin(input, 0)
                fs.writeFileSync(witnessFileName, buff)
                resolve(witnessFileName)
            })
            .catch((error) => {
                reject(error)
            })
    })
}
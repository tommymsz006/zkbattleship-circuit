require('dotenv').config()
const chai = require("chai")
const path = require("path")
const { wasm: wasm_tester } = require("circom_tester")
const { buildEddsa, buildMimcSponge } = require("circomlibjs")
const { BigNumber: BN } = require('ethers')
const { assert } = require('console')


describe("Battleship Circuit Test", () => {
    const ships = [
        ["1", "0", "0"],
        ["1", "1", "0"],
        ["1", "2", "0"],
        ["1", "3", "0"],
        ["1", "4", "0"]
    ]
    
    it("full test", async () => {
        // create hash
        const sponge = await buildMimcSponge()
        const shipHash = await sponge.multiHash(ships.flat(1))


        // sign hash
        const eddsa = await buildEddsa()
        const m = sponge.F.e(shipHash);
        const prv = Buffer.from(process.env.PKEY, 'hex');
        const pub = eddsa.prv2pub(prv)
        const sig = eddsa.signMiMCSponge(prv, m)
        assert(eddsa.verifyMiMCSponge(m, sig, pub))
        // run through circuit
        const circuit = await wasm_tester(path.resolve(__dirname, "../circuits/boardValidity.circom"))
        const witness = await circuit.calculateWitness({
            ships,
            shipHash: sponge.F.toObject(m),
            signature: [
                sponge.F.toObject(sig.R8[0]),
                sponge.F.toObject(sig.R8[1]),
                sig.S
            ],
            pubkey: [
                sponge.F.toObject(pub[0]),
                sponge.F.toObject(pub[1])
            ], 
        })
        await circuit.assertOut(witness, { out: 1 })
    })
})
// require('dotenv').config()
// const { expect } = require("chai").use(require('chai-as-promised'))
// const path = require("path")
// const { wasm: wasm_tester } = require("circom_tester")
// const { buildEddsa, buildMimcSponge } = require("circomlibjs")
// const crypto = require('crypto')

// const ERROR_MSG_BOARD = 'Assert Failed. Error in template boardValidity_29 line: ' // from boardValidity.circom
// const ERROR_MSG_SIG = 'Assert Failed. Error in template ForceEqualIfEnabled_27 line: 56' // from imported eddsamimcsponge.circom

// const CIRCUIT_PATH = path.resolve(__dirname, "../circuits/boardValidity.circom") // path to verifyBoard.circom

// describe("Initial Ship Placement Integrity Tests", () => {
//     let sponge, eddsa, F //circomlibjs / ffjavascript imports
    
//     before(async () => {
//         sponge = await buildMimcSponge()
//         eddsa = await buildEddsa()
//         F = sponge.F
//     })
    
//     it("Prove valid boards", async () => {
//         //define valid board configuration
//         const ships = [
//             ["1", "0", "0"],
//             ["1", "1", "0"],
//             ["1", "2", "0"],
//             ["1", "3", "0"],
//             ["1", "4", "0"]
//         ]
//         // eddsa signer
//         const prv = Buffer.from(process.env.PKEY, 'hex');
//         const pub = eddsa.prv2pub(prv)
//         // create hash and sign
//         const shipHash = await sponge.multiHash(ships.flat(1))
//         console.log('shipHash BigInt', F.toObject(shipHash))
//         // const sig = eddsa.signMiMCSponge(prv, shipHash)
//         // expect(eddsa.verifyMiMCSponge(shipHash, sig, pub))
//         // // run through circuit simulator
//         // const circuit = await wasm_tester(path.resolve(CIRCUIT_PATH))
//         // const witness = await circuit.calculateWitness({
//         //     ships,
//         //     signature: [
//         //         F.toObject(sig.R8[0]),
//         //         F.toObject(sig.R8[1]),
//         //         sig.S
//         //     ],
//         //     pubkey: pub.map(entry => F.toObject(entry))
//         // })
//         // console.log('w', witness)
//         // await circuit.assertOut(witness, {})
//         // // @todo once snarkjs witness calculator is fixed actually run circuit
//     })
//     xit("Fail to prove out of bounds ships: x", async () => {
//         const ships = [
//             ["-1", "0", "0"],
//             ["1", "1", "0"],
//             ["1", "2", "0"],
//             ["1", "3", "0"],
//             ["1", "4", "0"]
//         ]
//         // eddsa signer
//         const prv = Buffer.from(process.env.PKEY, 'hex');
//         const pub = eddsa.prv2pub(prv)
//         // create hash and sign
//         const shipHash = await sponge.multiHash(ships.flat(1))
//         const sig = eddsa.signMiMCSponge(prv, shipHash)
//         expect(eddsa.verifyMiMCSponge(shipHash, sig, pub))
//         // try to compute witness
//         const circuit = await wasm_tester(path.resolve(CIRCUIT_PATH))
//         await expect(circuit.calculateWitness({
//             ships,
//             signature: [
//                 F.toObject(sig.R8[0]),
//                 F.toObject(sig.R8[1]),
//                 sig.S
//             ],
//             pubkey: pub.map(entry => F.toObject(entry))
//         })).to.be.rejectedWith(Error, `${ERROR_MSG_BOARD}24`)
//         // boardValidity.circom:24 checks x/y range
//     })
//     xit("Fail to prove out of bounds ships: y", async () => {
//         const ships = [
//             ["1", "-1", "0"],
//             ["1", "1", "0"],
//             ["1", "2", "0"],
//             ["1", "3", "0"],
//             ["1", "4", "0"]
//         ]
//         // eddsa signer
//         const prv = Buffer.from(process.env.PKEY, 'hex');
//         const pub = eddsa.prv2pub(prv)
//         // create hash and sign
//         const shipHash = await sponge.multiHash(ships.flat(1))
//         const sig = eddsa.signMiMCSponge(prv, shipHash)
//         expect(eddsa.verifyMiMCSponge(shipHash, sig, pub))
//         // try to compute witness
//         const circuit = await wasm_tester(path.resolve(CIRCUIT_PATH))
//         await expect(circuit.calculateWitness({
//             ships,
//             signature: [
//                 F.toObject(sig.R8[0]),
//                 F.toObject(sig.R8[1]),
//                 sig.S
//             ],
//             pubkey: pub.map(entry => F.toObject(entry))
//         })).to.be.rejectedWith(Error, `${ERROR_MSG_BOARD}24`)
//         // boardValidity.circom:24 checks x/y range
//     })
//     xit("Fail to prove out of bounds ships: z", async () => {
//         const ships = [
//             ["0", "0", "3"],
//             ["1", "1", "0"],
//             ["1", "2", "0"],
//             ["1", "3", "0"],
//             ["1", "4", "0"]
//         ]
//         // eddsa signer
//         const prv = Buffer.from(process.env.PKEY, 'hex');
//         const pub = eddsa.prv2pub(prv)
//         // create hash and sign
//         const shipHash = await sponge.multiHash(ships.flat(1))
//         const sig = eddsa.signMiMCSponge(prv, shipHash)
//         expect(eddsa.verifyMiMCSponge(shipHash, sig, pub))
//         // try to compute witness
//         const circuit = await wasm_tester(path.resolve(CIRCUIT_PATH))
//         await expect(circuit.calculateWitness({
//             ships,
//             signature: [
//                 F.toObject(sig.R8[0]),
//                 F.toObject(sig.R8[1]),
//                 sig.S
//             ],
//             pubkey: pub.map(entry => F.toObject(entry))
//         })).to.be.rejectedWith(Error, `${ERROR_MSG_BOARD}23`)
//         // boardValidity.circom:23 checks z range
//     })
//     xit("Fail to prove colliding ships", async () => {
//         const ships = [
//             ["1", "0", "0"],
//             ["1", "1", "0"],
//             ["1", "2", "0"],
//             ["1", "3", "0"],
//             ["2", "0", "1"] //bad ship
//         ]
//         // eddsa signer
//         const prv = Buffer.from(process.env.PKEY, 'hex');
//         const pub = eddsa.prv2pub(prv)
//         // create hash and sign
//         const shipHash = await sponge.multiHash(ships.flat(1))
//         const sig = eddsa.signMiMCSponge(prv, shipHash)
//         expect(eddsa.verifyMiMCSponge(shipHash, sig, pub))
//         // try to compute witness
//         const circuit = await wasm_tester(path.resolve(CIRCUIT_PATH))
//         await expect(circuit.calculateWitness({
//             ships,
//             signature: [
//                 F.toObject(sig.R8[0]),
//                 F.toObject(sig.R8[1]),
//                 sig.S
//             ],
//             pubkey: pub.map(entry => F.toObject(entry))
//         })).to.be.rejectedWith(Error, `${ERROR_MSG_BOARD}35`)
//         // boardValidity.circom:32 check collision on x axis
//         // boardValidity.circom:35 check collision on y axis (5th ship is problem ship)
//     })
//     xit("Fail to prove different ships than signed by pubkey", async () => {
//         const ships0 = [
//             ["1", "0", "0"],
//             ["1", "1", "0"],
//             ["1", "2", "0"],
//             ["1", "3", "0"],
//             ["1", "4", "0"]
//         ]
//         const ships1 = [
//             ["0", "0", "0"],
//             ["0", "1", "0"],
//             ["0", "2", "0"],
//             ["0", "3", "0"],
//             ["0", "4", "0"]
//         ]
//         // eddsa signer
//         const prv = Buffer.from(process.env.PKEY, 'hex');
//         const pub = eddsa.prv2pub(prv)
//         // create hash and sign
//         const shipHash = await sponge.multiHash(ships0.flat(1))
//         const sig = eddsa.signMiMCSponge(prv, shipHash)
//         expect(eddsa.verifyMiMCSponge(shipHash, sig, pub))
//         // try to compute witness
//         const circuit = await wasm_tester(path.resolve(CIRCUIT_PATH))
//         await expect(circuit.calculateWitness({
//             ships: ships1,
//             signature: [
//                 F.toObject(sig.R8[0]),
//                 F.toObject(sig.R8[1]),
//                 sig.S
//             ],
//             pubkey: pub.map(entry => F.toObject(entry))
//         })).to.be.rejectedWith(Error, ERROR_MSG_SIG)
//         // failure occurs in eddsa signature verification failure from imported eddsamimcsponge.circom
//     })
//     xit("Fail to prove ships not signed by pubkey", async () => {
//         const ships = [
//             ["0", "0", "0"],
//             ["0", "1", "0"],
//             ["0", "2", "0"],
//             ["0", "3", "0"],
//             ["0", "4", "0"]
//         ]
//         // eddsa signer
//         const prv = Buffer.from(process.env.PKEY, 'hex');
//         const pub0 = eddsa.prv2pub(prv)
//         const pub1 = eddsa.prv2pub(crypto.randomBytes(32))
//         // create hash and sign
//         const shipHash = await sponge.multiHash(ships.flat(1))
//         const sig = eddsa.signMiMCSponge(prv, shipHash)
//         expect(eddsa.verifyMiMCSponge(shipHash, sig, pub0))
//         // try to compute witness
//         const circuit = await wasm_tester(CIRCUIT_PATH)
//         await expect(circuit.calculateWitness({
//             ships,
//             signature: [
//                 F.toObject(sig.R8[0]),
//                 F.toObject(sig.R8[1]),
//                 sig.S
//             ],
//             pubkey: pub1.map(entry => F.toObject(entry))
//         })).to.be.rejectedWith(Error, ERROR_MSG_SIG)
//         // failure occurs in eddsa signature verification failure from imported eddsamimcsponge.circom
//     })
// })
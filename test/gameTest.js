const { ethers } = require('hardhat')
const { buildMimcSponge } = require("circomlibjs")
const snarkjs = require('snarkjs')
const { expect } = require('chai').use(require('chai-as-promised'))

// verification key json files
const verificationKeys = {
    board: require('../zk/board_verification_key.json'),
    shot: require('../zk/shot_verification_key.json')
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

// inline ephemeral logging
function printLog(msg) {
    if (process.stdout.isTTY) {
        process.stdout.clearLine(-1);
        process.stdout.cursorTo(0);
        process.stdout.write(msg);
    }
}

describe('Play Battleship on-chain', async () => {
    let game, bv, sv, token // contracts
    let alice, bob // identities
    let mimcSponge // the mimc sponge hasher
    let one = ethers.utils.parseUnits('1', 'ether') // 1e18
    let F // finite field lib
    let boardHashes = { alice: null, bob: null } // board hashes, computed later

    // x, y, z (horizontal/ verical orientation) ship placements
    const boards = {
        alice: [
            ["0", "0", "0"],
            ["0", "1", "0"],
            ["0", "2", "0"],
            ["0", "3", "0"],
            ["0", "4", "0"]
        ],
        bob: [
            ["1", "0", "0"],
            ["1", "1", "0"],
            ["1", "2", "0"],
            ["1", "3", "0"],
            ["1", "4", "0"]
        ]
    }

    // shots alice to hit / bob to miss
    const shots = {
        alice: [
            [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
            [1, 1], [2, 1], [3, 1], [4, 1],
            [1, 2], [2, 2], [3, 2],
            [1, 3], [2, 3], [3, 3],
            [1, 4], [2, 4]
        ],
        bob: [
            [9, 9], [9, 8], [9, 7], [9, 6], [9, 5],
            [9, 4], [9, 3], [9, 2], [9, 1],
            [9, 0], [8, 9], [8, 8],
            [8, 7], [8, 6], [8, 5],
            [8, 4]
        ]
    }

    /**
     * Simulate one guaranteed hit and one guaranteed miss played in the game
     * 
     * @param aliceNonce number - number of shots alice has already taken
     *  - range should be 1 through 16
     */
    async function simulateTurn(aliceNonce) {
        printLog(`Bob reporting result of Alice shot #${aliceNonce - 1} (Turn ${aliceNonce * 2 - 1})`)
        /// BOB PROVES ALICE PREV REGISTERED SHOT HIT ///
        // bob's shot hit/miss integrity proof public / private inputs
        let input = {
            ships: boards.bob,
            hash: F.toObject(boardHashes.bob),
            coords: shots.alice[aliceNonce - 1],
            hit: 1
        }
        // compute witness and run through groth16 circuit for proof / signals
        let { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            'zk/shot_js/shot.wasm',
            'zk/zkey/shot_final.zkey'
        )
        // verify proof locally
        await snarkjs.groth16.verify(verificationKeys.shot, publicSignals, proof)
        // prove alice's registered shot hit, and register bob's next shot
        let args = buildArgs(proof, publicSignals)
        let tx = await (await game.connect(bob).turn(
            1, // game id
            true, // hit bool
            shots.bob[aliceNonce - 1], // returning fire / next shot to register (not part of proof)
            args[0], // pi.a
            args[1][0], // pi.b_0
            args[1][1], //pi.b_1
            args[2] // pi.c
        )).wait()
        /// ALICE PROVES BOB PREV REGISTERED SHOT MISSED ///
        printLog(`Alice reporting result of Bob shot #${aliceNonce - 1} (Turn ${aliceNonce * 2})`)
        // bob's shot hit/miss integrity proof public / private inputs
        input = {
            ships: boards.alice,
            hash: F.toObject(boardHashes.alice),
            coords: shots.bob[aliceNonce - 1],
            hit: 0
        }
            // compute witness and run through groth16 circuit for proof / signals
            ; ({ proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                'zk/shot_js/shot.wasm',
                'zk/zkey/shot_final.zkey'
            ))
        // verify proof locally
        await snarkjs.groth16.verify(verificationKeys.shot, publicSignals, proof)
        // prove bob's registered shot missed, and register alice's next shot
        args = buildArgs(proof, publicSignals)
        await (await game.connect(alice).turn(
            1, // game id
            false, // hit bool
            shots.alice[aliceNonce], // returning fire / next shot to register (not part of proof)
            args[0], // pi.a
            args[1][0], // pi.b_0
            args[1][1], // pi.b_1
            args[2] // pi.c
        )).wait()
    }

    before(async () => {
        // instantiate mimc sponge on bn254 curve + store ffjavascript obj reference
        mimcSponge = await buildMimcSponge()
        F = mimcSponge.F
        // store board hashes
        boardHashes.alice = await mimcSponge.multiHash(boards.alice.flat())
        boardHashes.bob = await mimcSponge.multiHash(boards.bob.flat())
        // set signers
        const signers = await ethers.getSigners()
        alice = signers[1]
        bob = signers[2]
        // deploy verifiers
        const svFactory = await ethers.getContractFactory('ShotVerifier')
        sv = await svFactory.deploy()
        const bvFactory = await ethers.getContractFactory('BoardVerifier')
        bv = await bvFactory.deploy()
        // deploy ticket token
        const tokenFactory = await ethers.getContractFactory('Token')
        token = await tokenFactory.deploy()
        // deploy game
        const gameFactory = await ethers.getContractFactory('BattleshipGame')
        game = await gameFactory.deploy(ethers.constants.AddressZero, bv.address, sv.address, token.address)
        console.log('game addr', game.address)
        // give players tickets and allow game contract to spend
        await (await token.connect(alice).mint(alice.address, one)).wait()
        await (await token.connect(alice).approve(game.address, one)).wait()
        await (await token.connect(bob).mint(bob.address, one)).wait()
        await (await token.connect(bob).approve(game.address, one)).wait()
    })

    describe("Play game to completion", async () => {
        it("Start a new game", async () => {
            // board starting verification proof public / private inputs
            const input = {
                ships: boards.alice,
                hash: F.toObject(boardHashes.alice)
            }
            // compute witness and run through groth16 circuit for proof / signals
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                'zk/board_js/board.wasm',
                'zk/zkey/board_final.zkey',
            )
            // verify proof locally
            await snarkjs.groth16.verify(
                require('../zk/board_verification_key.json'),
                publicSignals,
                proof
            )
            // prove on-chain hash is of valid board configuration
            const args = buildArgs(proof, publicSignals)
            let tx = await (await game.connect(alice).newGame(
                F.toObject(boardHashes.alice),
                args[0], //pi.a
                args[1][0], //pi.b_0
                args[1][1], //pi.b_1
                args[2] //pi.c
            )).wait()
        })
        it("Join an existing game", async () => {
            // board starting verification proof public / private inputs
            const input = {
                ships: boards.bob,
                hash: F.toObject(boardHashes.bob)
            }
            // compute witness and run through groth16 circuit for proof / signals
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                'zk/board_js/board.wasm',
                'zk/zkey/board_final.zkey',
            )
            // verify proof locally
            await snarkjs.groth16.verify(
                require('../zk/board_verification_key.json'),
                publicSignals,
                proof
            )
            // prove on-chain hash is of valid board configuration
            const args = buildArgs(proof, publicSignals)
            await (await game.connect(bob).joinGame(
                1,
                F.toObject(boardHashes.bob),
                args[0], //pi.a
                args[1][0], //pi.b_0
                args[1][1], //pi.b_1
                args[2] //pi.c
            ))
        })
        it("opening shot", async () => {
            await (await game.connect(alice).firstTurn(1, [1, 0])).wait()
        })
        it('Prove hit/ miss for 32 turns', async () => {
            for (let i = 1; i <= 16; i++) {
                await simulateTurn(i)
            }
        })
        it('Alice wins and receives award on sinking all of Bob\'s ships', async () => {
            // bob's shot hit/miss integrity proof public / private inputs
            const input = {
                ships: boards.bob,
                hash: F.toObject(boardHashes.bob),
                coords: shots.alice[16],
                hit: 1
            }
            // compute witness and run through groth16 circuit for proof / signals
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                'zk/shot_js/shot.wasm',
                'zk/zkey/shot_final.zkey'
            )
            // verify proof locally
            await snarkjs.groth16.verify(verificationKeys.shot, publicSignals, proof)
            // prove alice's registered shot hit, and register bob's next shot
            const args = buildArgs(proof, publicSignals)
            await (await game.connect(bob).turn(
                1, // game id
                true, // hit bool
                [0, 0], // shot params are ignored on reporting all ships sunk, can be any uint256
                args[0], // pi.a
                args[1][0], // pi.b_0
                args[1][1], // pi.b_1
                args[2] // pi.c
            )).wait()
        })
    })
})

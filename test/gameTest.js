const { ethers } = require('hardhat')
const snarkjs = require('snarkjs')
const { buildArgs, genWtns } = require('./utils')
const { buildMimcSponge } = require("circomlibjs")
const { BigNumber: BN } = ethers

describe('Play Battleship on-chain', async () => {
    let game, bv, sv, token // contracts
    let owner, alice, bob // identities
    let mimcSponge // the mimc sponge hasher
    let one = ethers.utils.parseUnits('1', 'ether') // 1e18

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

    // shots alice must make to win the game
    const shots = [
        [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        [1, 1], [2, 1], [3, 1], [4, 1],
        [1, 2], [2, 2], [3, 2],
        [1, 3], [2, 3], [3, 3],
        [1, 4], [2, 4]
    ]



    before(async () => {
        // instantiate mimc sponge on bn254 curve
        mimcSponge = await buildMimcSponge()
        // set signers
        const signers = await ethers.getSigners()
        owner = signers[0]
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
        game = await gameFactory.deploy(bv.address, sv.address, token.address)
        // give players tickets and allow game contract to spend
        await (await token.connect(alice).mint(alice.address, one)).wait()
        await (await token.connect(alice).approve(game.address, one)).wait()
        await (await token.connect(bob).mint(bob.address, one)).wait()
        await (await token.connect(bob).approve(game.address, one)).wait()
    })

    describe("LETS PLAY", async () => {
        it("start new game", async () => {
            const boardHash = await mimcSponge.multiHash(boards.alice.flat())
            const input = {
                ships: boards.alice,
                hash: mimcSponge.F.toObject(boardHash)
            }
            await genWtns(
                input,
                'zk/board_js/board.wasm',
                'zk/witnesses/board0.wtns'
            )
            const { proof, publicSignals } = await snarkjs.groth16.prove(
                'zk/zkey/board_final.zkey',
                'zk/witnesses/board0.wtns'
            )
            await snarkjs.groth16.verify(
                require('../zk/board_verification_key.json'),
                publicSignals,
                proof
            )
            const args = buildArgs(proof, publicSignals)
            const tx = await (await game.connect(alice).newGame(
                mimcSponge.F.toObject(boardHash),
                args[0],
                args[1],
                args[2]
            )).wait()
        })
        it("join existing game", async () => {
            const boardHash = await mimcSponge.multiHash(boards.bob.flat())
            const input = {
                ships: boards.bob,
                hash: mimcSponge.F.toObject(boardHash)
            }
            await genWtns(
                input,
                'zk/board_js/board.wasm',
                'zk/witnesses/board1.wtns'
            )
            const { proof, publicSignals } = await snarkjs.groth16.prove(
                'zk/zkey/board_final.zkey',
                'zk/witnesses/board1.wtns'
            )
            await snarkjs.groth16.verify(
                require('../zk/board_verification_key.json'),
                publicSignals,
                proof
            )
            const args = buildArgs(proof, publicSignals)
            const tx = await (await game.connect(bob).joinGame(
                1,
                mimcSponge.F.toObject(boardHash),
                args[0],
                args[1],
                args[2]
            ))
        })
        it("opening shot", async () => {
            await (await game.connect(alice).firstTurn(1, [1, 0])).wait()
        })
        it("prove hit and make next shot", async () => {
            const boardHash = await mimcSponge.multiHash(boards.bob.flat())
            const input = {
                ships: boards.bob,
                hash: mimcSponge.F.toObject(boardHash),
                coords: [1, 0],
                hit: 1
            }
            await genWtns(
                input,
                'zk/shot_js/shot.wasm',
                'zk/witnesses/shot0.wtns'
            )
            const { proof, publicSignals } = await snarkjs.groth16.prove(
                'zk/zkey/shot_final.zkey',
                'zk/witnesses/shot0.wtns'
            )
            await snarkjs.groth16.verify(
                require('../zk/shot_verification_key.json'),
                publicSignals,
                proof
            )
            const args = buildArgs(proof, publicSignals)
            const tx = await (await game.connect(bob).turn(
                1,
                true,
                [8, 8],
                args[0],
                args[1],
                args[2]
            )).wait()
        })
        it("prove miss and make next shot", async () => {
            const boardHash = await mimcSponge.multiHash(boards.alice.flat())
            const input = {
                ships: boards.alice,
                hash: mimcSponge.F.toObject(boardHash),
                coords: [8, 8],
                hit: 0
            }
            await genWtns(
                input,
                'zk/shot_js/shot.wasm',
                'zk/witnesses/shot1.wtns'
            )
            const { proof, publicSignals } = await snarkjs.groth16.prove(
                'zk/zkey/shot_final.zkey',
                'zk/witnesses/shot1.wtns'
            )
            await snarkjs.groth16.verify(
                require('../zk/shot_verification_key.json'),
                publicSignals,
                proof
            )
            const args = buildArgs(proof, publicSignals)
            const tx = await (await game.connect(alice).turn(
                1,
                false,
                [1, 1],
                args[0],
                args[1],
                args[2]
            )).wait()
        })
        xit("play to alice win", async () => {
            // I DON'T CARE THIS IS MESSY IT IS SUPER RUDIMENTARY DEMO
            // ALICE HIT TWO
            const hashes = {
                alice: await mimcSponge.multiHash(boards.alice.flat()),
                bob: await mimcSponge.multiHash(boards.bob.flat())
            }
            let input = {
                ships: boards.bob,
                hash: mimcSponge.F.toObject(hashes.bob),
                coords: [1, 1],
                hit: 1
            }
            await genWtns(
                input,
                'zk/shot_js/shot.wasm',
                'zk/witnesses/shot2.wtns'
            )
            let { proof, publicSignals } = await snarkjs.groth16.prove(
                'zk/zkey/shot_final.zkey',
                'zk/witnesses/shot2.wtns'
            )
            await snarkjs.groth16.verify(
                require('../zk/shot_verification_key.json'),
                publicSignals,
                proof
            )
            let args = buildArgs(proof, publicSignals)
            let tx = await (await game.connect(alice).turn(
                1,
                false,
                [8, 7],
                args[0],
                args[1],
                args[2]
            )).wait()

        })
    })

})

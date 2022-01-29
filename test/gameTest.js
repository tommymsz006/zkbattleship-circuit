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
    })

})
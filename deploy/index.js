const POLYGON_DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' // address of Polygon PoS Dai token
const POLYGON_FORWARDER='0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8'
const MUMBAI_FORWARDER='0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b'

/**
 * Deploy All Contracts
 */
module.exports = async ({ run, ethers, network, deployments }) => {
    // get deploying account
    const [operator] = await ethers.getSigners();
    // deploy verifiers
    const { address: bvAddress } = await deployments.deploy('BoardVerifier', {
        from: operator.address,
        log: true
    })
    const { address: svAddress } = await deployments.deploy('ShotVerifier', {
        from: operator.address,
        log: true
    })
    // if not on polygon mainnet deploy custom token to test with
    // else use live dai token to allow wagering
    let ticketAddress
    if (network.name === 'polygon')
        ticketAddress = POLYGON_DAI
    else {
        ({ address: ticketAddress } = await deployments.deploy('Token', {
            from: operator.address,
            log: true
        }))
    }
    // deploy Battleship Game Contract / Victory token
    const { address: gameAddress } = await deployments.deploy('BattleshipGame', {
        from: operator.address,
        args: [MUMBAI_FORWARDER, bvAddress, svAddress, ticketAddress],
        log: true
    })
    // verify deployed contracts
    // try {
    //     await run('verify:verify', { address: bvAddress })
    // } catch (e) {
    //     if (!alreadyVerified(e.toString())) throw new Error()
    // }
    // console.log('t')
    // try {
    //     await run('verify:verify', { address: svAddress })
    // } catch (e) {
    //     if (!alreadyVerified(e.toString())) throw new Error()
    // }
    // if (network.name !== 'polygon') {
    //     try {
    //         await run('verify:verify', { address: ticketAddress })
    //     } catch (e) {
    //         if (!alreadyVerified(e.toString())) throw new Error()
    //     }
    // }
    // console.log('r')
    // try {
    //     await run('verify:verify', {
    //         address: gameAddress,
    //         constructorArguments: [bvAddress, svAddress, ticketAddress]
    //     })
    // } catch (e) {
    //     if (!alreadyVerified(e.toString())) throw new Error()
    // }
    // console.log('Deployment and Verification Success')
}

/**
 * Determine if err message can be ignored
 * @param {string} err - the error text returned from etherscan verification
 * @return true if bytecode is verified, false otherwise 
 */
const alreadyVerified = (err) => {
    return err.includes('Reason: Already Verified')
        || err.includes('Contract source code already verified')
}

module.exports.tags = ['Verifier']
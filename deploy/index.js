/**
 * Deploy All Contracts
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
    // get deploying account
    const { operator } = await getNamedAccounts();
    // deploy verifiers
    const { address: bvAddress } = await deployments.deploy('BoardVerifier', {
        from: operator,
        log: true
    })
    const { address: svAddress } = await deployments.deploy('ShotVerifier', {
        from: operator,
        log: true
    })
    // deploy ZKB Game Ticket token
    const { address: ticketAddress } = await deployments.deploy('ZKBTicket', {
        contract: 'Token',
        from: operator,
        log: true
    })
    // deploy Battleship Game Contract / Victory token
    const { address: gameAddress } = await deployments.deploy('ZKBGame', {
        contract: 'BattleshipGame',
        from: operator,
        args: [bvAddress, svAddress, ticketAddress],
        log: true
    })
}
module.exports.tags = ['Verifier']
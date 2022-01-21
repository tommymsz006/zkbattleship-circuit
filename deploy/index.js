/**
 * Deploy All Contracts
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
    // get deploying account
    const { operator } = await getNamedAccounts();
    // deploy board integrity verifier
    const { address: verifierAddress } = await deployments.deploy('BoardVerifier', {
        contract: 'Verifier',
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
        args: [verifierAddress, ticketAddress],
        log: true
    })
}
module.exports.tags = ['Verifier']
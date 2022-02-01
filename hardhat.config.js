require('dotenv').config()
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-waffle")
require('hardhat-deploy')
require('hardhat-deploy-ethers')

const { INFURA_RPC, MNEMONIC } = process.env

const XDAI_RPC = 'https://rpc.xdaichain.com/'
const SOKOL_RPC = 'https://sokol.poa.network'

const accounts = {
    mnemonic: MNEMONIC,
    path: "m/44'/60'/0'/0",
    initialIndex: 0,
    count: 10,
};

module.exports = {
    solidity: {
        version: '0.8.11',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        goerli: {
            url: `https://goerli.infura.io/v3/${INFURA_RPC}`,
            accounts
        },
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${INFURA_RPC}`,
            accounts
        },
        xdai: {
            url: XDAI_RPC,
            accounts
        },
        sokol: {
            url: SOKOL_RPC,
            accounts
        }
    },
    mocha: {
        timeout: 2000000
    }
}
require('dotenv').config()
require("@nomiclabs/hardhat-ethers")
require('hardhat-deploy')
require('hardhat-deploy-ethers')

const {
    INFURA_RPC,
    XDAI_RPC,
    SOKOL_RPC,
    MNEMONIC,
    PKEY
} = process.env

const accounts = PKEY
    ? //Private key overrides mnemonic - leave pkey empty in .env if using mnemonic
    [`0x${PKEY}`]
    : {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10,
    };

module.exports = {
    solidity: {
        version: '0.8.6',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        goerli: {
            url: `goerli.infura.io/v3/${INFURA_RPC}`,
            accounts
        },
        rinkeby: {
            url: `rinkeby.infura.io/v3/$${INFURA_RPC}`,
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
    namedAccounts: {
        operator: 0,
        alice: 1,
        bob: 2,
        charlie: 3
    }
}
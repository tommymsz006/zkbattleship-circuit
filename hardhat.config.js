require('dotenv').config()
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-waffle")
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
            url: `https://goerli.infura.io/v3/2623565f59b94e47b0eb5a9286f3a070`,
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
    mocha: {
        timeout: 2000000
    }
}
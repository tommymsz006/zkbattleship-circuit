require('dotenv').config()
require('hardhat-deploy');

const {
    MNEMONIC,
    PKEY,
    XDAI_RPC,
    INFURA
} = process.env;

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
    defaultNetwork: "hardhat",
    namedAccounts: {
        deployer: 0,
        alice: 1,
        bob: 2
    },
    solidity: {
        version: '0.6.11',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000
            }
        }
    },
    networks: {
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${INFURA}`,
            accounts
        },
        xdai: {
            url: XDAI_RPC,
            accounts
        }
    }
}

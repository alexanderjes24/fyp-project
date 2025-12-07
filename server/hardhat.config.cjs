// hardhat.config.cjs

require("@typechain/hardhat");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Define the configuration object
const config = {
  solidity: "0.8.28",
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },

  networks: {
    // This is the only network name accepted by 'npx hardhat node'
    hardhat: {
      chainId: 31337,
      // *** THIS FORCES THE PERSISTENCE ***
      // dbPath must be directly inside the hardhat network object,
      // not nested under 'chain' in recent versions.
      dbPath: "./data" 
    },
    
    // This is the network your scripts and Fastify will use to CONNECT to the running node.
    localhost: {
      url: process.env.BLOCKCHAIN_PROVIDER || "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.BACKEND_WALLET_KEY ? [process.env.BACKEND_WALLET_KEY] : []
    }
  }
};

// Export the configuration
module.exports = config;
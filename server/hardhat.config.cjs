require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: process.env.BLOCKCHAIN_PROVIDER || "http://127.0.0.1:8545",
      accounts: process.env.BACKEND_WALLET_KEY ? [process.env.BACKEND_WALLET_KEY] : []
    }
  }
};

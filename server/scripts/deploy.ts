import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const rpcUrl = process.env.BLOCKCHAIN_PROVIDER;
  if (!rpcUrl) throw new Error("Missing BLOCKCHAIN_PROVIDER in .env");

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const privateKey = process.env.BACKEND_WALLET_KEY;
  if (!privateKey) throw new Error("Missing BACKEND_WALLET_KEY in .env");

  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Wallet address: ${wallet.address}`);
  console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);

  if (balance <= 0) throw new Error("Insufficient funds to deploy the contract");

  // Use CredentialRegistry artifact
  const artifact = await hre.artifacts.readArtifact("CredentialRegistry");

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Deploying CredentialRegistry contract...");

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed at:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

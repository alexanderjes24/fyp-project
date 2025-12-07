// server/blockchain/credential.ts
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import CredentialRegistryArtifact from "../artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json";

dotenv.config();

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

function initBlockchain() {
  if (provider && wallet && contract) return; 

  const rpcUrl = process.env.BLOCKCHAIN_PROVIDER; // e.g., http://127.0.0.1:8545/
  const privateKey = process.env.BACKEND_WALLET_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error("Missing Blockchain Env Vars (PROVIDER, WALLET_KEY, or ADDRESS)");
  }

  provider = new ethers.JsonRpcProvider(rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);

  // 1. Log this to ensure you are talking to the right contract
  console.log(`🔌 Connecting to Contract at: ${contractAddress}`);

  const contractABI = CredentialRegistryArtifact.abi;
  contract = new ethers.Contract(contractAddress, contractABI, wallet);
}

export async function storeCredentialHash(uid: string, hash: string) {
  try {
    initBlockchain();

    if (!contract) throw new Error("Contract initialization failed");

    console.log(`Processing Transaction for UID: ${uid} with Hash: ${hash}`);

    // 2. Send the transaction
    const tx = await contract.storeCredential(uid, hash);
    console.log(`Transaction sent: ${tx.hash}`);

    // 3. Wait for confirmation
    const receipt = await tx.wait();

    // 4. Check status (1 = success, 0 = revert)
    if (receipt.status === 0) {
        throw new Error("Transaction execution reverted by EVM");
    }

    return receipt; 

  } catch (err: any) {
    console.error("❌ Blockchain Error:", err.reason || err.message);
    // 5. RE-THROW the error so admin.ts handles it, don't return null
    throw err; 
  }
}

export async function getVerifiedCredential(uid: string) {
    try {
        initBlockchain();
        if (!contract) throw new Error("Contract not initialized");

        // Calls the public view function on your deployed contract
        const [hash, timestamp] = await contract.getCredential(uid);
        
        // Check if the credential exists (hash length > 0 is a good check)
        if (hash.length === 0) {
            return null; 
        }

        return { 
            hash: hash, 
            timestamp: Number(timestamp) * 1000 // Return as JS milliseconds
        };
    } catch (error) {
        console.error("Error retrieving credential from blockchain:", error);
        throw error;
    }
}
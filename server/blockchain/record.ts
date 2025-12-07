// server/blockchain/record.ts

import { ethers } from "ethers";
import * as dotenv from "dotenv";

// NOTE: You must update this path/name if you changed the contract file/artifact name!
// Assuming you use the same artifact structure as before, but with the new functions.
import DataRegistryArtifact from "../artifacts/contracts/DataRegistry.sol/DataRegistry.json";

dotenv.config();

// --- Module State (Singleton Pattern) ---
let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

function initBlockchain() {
    if (provider && wallet && contract) return;

    // Environment variables should be the same as used by credential.ts
    const rpcUrl = process.env.BLOCKCHAIN_PROVIDER; // e.g., http://127.0.0.1:8545/
    const privateKey = process.env.BACKEND_WALLET_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
        throw new Error("Missing Blockchain Env Vars (PROVIDER, WALLET_KEY, or ADDRESS)");
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    wallet = new ethers.Wallet(privateKey, provider);

    console.log(`🔌 Connecting to Data Registry at: ${contractAddress}`);

    const contractABI = DataRegistryArtifact.abi;
    // The wallet acts as the signer for transactions
    contract = new ethers.Contract(contractAddress, contractABI, wallet);
}

// ----------------------------------------------------
// TRANSACTION: Stores the hash of a completed medical record
// ----------------------------------------------------
export async function storeMedicalRecordHash(
    bookingId: string, 
    therapistId: string, 
    hash: string
) {
    try {
        initBlockchain();
        if (!contract) throw new Error("Contract initialization failed");

        console.log(`Processing Medical Record for Booking: ${bookingId}`);

        // 1. Call the new contract function
        // Note: The wallet passed during initialization is the signer (the Admin)
        // The contract function requires bookingId, therapistId, and hash.
        const tx = await contract.addMedicalRecord(bookingId, therapistId, hash);
        console.log(`Transaction sent: ${tx.hash}`);

        // 2. Wait for confirmation
        const receipt = await tx.wait();

        // 3. Check status
        if (receipt.status === 0) {
            throw new Error("Transaction execution reverted by EVM");
        }

        return receipt; 

    } catch (err: any) {
        console.error("❌ Blockchain Error (Store Record):", err.reason || err.message);
        throw err; 
    }
}

// ----------------------------------------------------
// VIEW: Retrieves the immutable proof of a medical record
// ----------------------------------------------------
export async function getVerifiedMedicalRecord(bookingId: string) {
    try {
        initBlockchain();
        if (!contract) throw new Error("Contract not initialized");

        // Calls the public view function 
        // Returns (therapistId, hash, timestamp) as per DataRegistry.sol
        const [therapistId, hash, timestamp] = await contract.getMedicalRecordProof(bookingId);
        
        // Check if the record proof exists (hash length > 0)
        if (hash.length === 0 || therapistId.length === 0) {
            return null; 
        }

        return { 
            therapistId: therapistId,
            hash: hash, 
            timestamp: Number(timestamp) * 1000 // Convert seconds to JS milliseconds
        };
    } catch (error) {
        console.error("Error retrieving medical record proof from blockchain:", error);
        throw error;
    }
}
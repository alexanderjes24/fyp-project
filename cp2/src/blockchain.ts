// src/blockchain.ts
import { ethers } from "ethers";

// ----------- CONFIG -----------
const CONTRACT_ADDRESS = "YOUR_SMART_CONTRACT_ADDRESS";
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "recordId", "type": "string" },
      { "internalType": "string", "name": "hash", "type": "string" }
    ],
    "name": "storeRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "recordId", "type": "string" }
    ],
    "name": "getRecord",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
// --------------------------------


// 🔌 Connect MetaMask + return contract instance
export async function getContract() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not detected");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum); 
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}


// 📝 HASHING FUNCTION (SHA-256)
export async function sha256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}


// 🚀 STORE medical record hash on blockchain
export async function storeRecordOnChain(recordId: string, data: string) {
  const contract = await getContract();
  const hash = await sha256(data);

  const tx = await contract.storeRecord(recordId, hash);
  await tx.wait(); // wait for confirmation

  return hash;
}


// 🔍 VERIFY record hash
export async function verifyRecord(recordId: string, data: string) {
  const contract = await getContract();
  const storedHash = await contract.getRecord(recordId);
  const newHash = await sha256(data);

  return {
    matches: storedHash === newHash,
    storedHash,
    newHash
  };
}

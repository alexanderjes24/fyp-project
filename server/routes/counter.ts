import { FastifyInstance } from "fastify";
import { ethers } from "ethers";
import counterAbi from "../artifacts/contracts/Counter.sol/Counter.json";
import * as dotenv from "dotenv";

dotenv.config(); // make sure this is at the top

export default async function blockchainRoutes(fastify: FastifyInstance) {
  // Provider + Wallet
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER);
  const wallet = new ethers.Wallet(process.env.BACKEND_WALLET_KEY!, provider);

  // DEBUG: check the contract address
  console.log("Contract address:", process.env.CONTRACT_ADDRESS);
  
  // Contract instance
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    counterAbi.abi,
    wallet
  );

  // GET current value
  fastify.get("/counter", async (req, res) => {
    try {
      const value = await contract.x();
      return { value: value.toString() };
    } catch (err) {
      console.error(err);
      return { error: "Failed to fetch value" };
    }
  });

  // POST new session (increment counter)
  fastify.post("/counter/add", async (req, res) => {
  try {
    const tx = await contract.inc();
    await tx.wait();
    return { txHash: tx.hash }; // <-- exact property
  } catch (err) {
    console.error(err);
    return { error: "Failed to store session" };
  }
});
// server/routes/counter.ts
fastify.get("/counter/receipt/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params as { txHash: string };
    if (!txHash) return { error: "No txHash provided" };

    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt;
  } catch (err) {
    console.error(err);
    return { error: "Failed to fetch receipt" };
  }
});
console.log("Contract address:", process.env.CONTRACT_ADDRESS);
console.log("Provider URL:", process.env.BLOCKCHAIN_PROVIDER);
}


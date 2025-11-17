import { FastifyInstance } from "fastify";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

export default async function consentRoutes(fastify: FastifyInstance) {
  // Load ABI safely using absolute path
  const abiPath = path.join(
    process.cwd(),
    "artifacts",
    "contracts",
    "Consent.sol",
    "Consent.json"
  );

  if (!fs.existsSync(abiPath)) {
    console.error("❌ ABI file NOT FOUND at:", abiPath);
    process.exit(1);
  }

  const consentJson = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  console.log("✔ ABI loaded from:", abiPath);

  // Provider + Wallet
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER);
  const wallet = new ethers.Wallet(process.env.BACKEND_WALLET_KEY!, provider);

  // Contract instance
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ CONSENT_CONTRACT_ADDRESS is missing in .env");
    process.exit(1);
  }

  console.log("✔ Using Contract Address:", contractAddress);

  const contract = new ethers.Contract(
    contractAddress,
    consentJson.abi,
    wallet
  );

  // GET total consents
  fastify.get("/total", async (req, res) => {
    try {
      const total = await contract.totalConsents();
      return { total: Number(total) };
    } catch (err) {
      console.error(err);
      return { error: "Failed to fetch total consents" };
    }
  });

  // POST give consent
  fastify.post("/agree", async (req, res) => {
    try {
      const { userId } = req.body as { userId: string };

      const userHash = ethers.keccak256(
        ethers.toUtf8Bytes(userId)
      );

      const tx = await contract.giveConsent(userHash);
      await tx.wait();

      return { txHash: tx.hash };
    } catch (err) {
      console.error(err);
      return { error: "Failed to record consent" };
    }
  });

  // GET all consents
  fastify.get("/all", async (req, res) => {
    try {
      const total = await contract.totalConsents();
      const records = [];

      for (let i = 0; i < Number(total); i++) {
        const record = await contract.records(i);

        records.push({
          userHash: record.userHash,
          timestamp: Number(record.timestamp),
        });
      }

      return { records };
    } catch (err) {
      console.error(err);
      return { error: "Failed to fetch consent records" };
    }
  });
}

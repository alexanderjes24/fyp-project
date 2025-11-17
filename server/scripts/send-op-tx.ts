import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Use your RPC endpoint (Amoy, OP, Sepolia, etc.)
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER!);

  // Signer wallet
  const wallet = new ethers.Wallet(process.env.BACKEND_WALLET_KEY!, provider);

  console.log("Sending 1 wei from", wallet.address, "to itself");

  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 1n, // sending 1 wei
  });

  await tx.wait();
  console.log("Transaction sent successfully:", tx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

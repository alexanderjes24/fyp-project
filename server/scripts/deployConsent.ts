import { ethers } from "hardhat";

async function main() {
  const Consent = await ethers.getContractFactory("Consent");
  const consent = await Consent.deploy();

  await consent.deployed();
  console.log("✅ Consent contract deployed at:", consent.address);
  console.log(`Update your .env file with:\nCONSENT_CONTRACT_ADDRESS=${consent.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

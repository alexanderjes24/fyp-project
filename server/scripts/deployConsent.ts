// ESM-safe Hardhat import
import hardhat from "hardhat";

// Cast to "any" so TypeScript stops complaining.
// This is the official workaround for Hardhat in ESM projects.
const hre: any = hardhat;

async function main() {
  const ethers = hre.ethers;

  const ConsentFactory = await ethers.getContractFactory("Consent");
  const contract = await ConsentFactory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Consent deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { ethers } from "hardhat";

const FUJI_USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Token (Fuji USDC):", FUJI_USDC_ADDRESS);

  const Factory = await ethers.getContractFactory("AvaPayBatchPayroll");
  const contract = await Factory.deploy(FUJI_USDC_ADDRESS, deployer.address);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("AvaPayBatchPayroll deployed to:", addr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


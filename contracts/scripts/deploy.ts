import { ethers } from "hardhat";

async function main() {
  const token = process.env.PAYROLL_TOKEN_ADDRESS ?? ethers.ZeroAddress; // ZeroAddress => native AVAX payouts
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Token:", token);

  const Factory = await ethers.getContractFactory("AvaPayBatchPayroll");
  const contract = await Factory.deploy(token, deployer.address);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("AvaPayBatchPayroll deployed to:", addr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


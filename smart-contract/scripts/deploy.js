const hre  = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log(`\nDeploying DecentraPay to "${hre.network.name}"...`);

  const Factory  = await hre.ethers.getContractFactory("DecentraPay");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅  DecentraPay deployed at: ${address}`);

  // Auto-write CONTRACT_ADDRESS to root .env
  const envPath = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");
    if (env.includes("CONTRACT_ADDRESS=")) {
      env = env.replace(/^CONTRACT_ADDRESS=.*/m, `CONTRACT_ADDRESS=${address}`);
    } else {
      env += `\nCONTRACT_ADDRESS=${address}\n`;
    }
    fs.writeFileSync(envPath, env, "utf8");
    console.log(`📝  CONTRACT_ADDRESS written to .env`);
  } else {
    console.log(`ℹ️   Create .env and set:\n    CONTRACT_ADDRESS=${address}`);
  }

  console.log(`\nNext steps:`);
  console.log(`  1. Start backend:  cd backend && npm run dev`);
  console.log(`  2. Start web:      cd frontend-web && npm start\n`);
}

main().catch(err => { console.error(err); process.exit(1); });

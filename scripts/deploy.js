async function main() {
  const supplyChain = await hre.ethers.deployContract("SupplyChain");
  await supplyChain.waitForDeployment();
  console.log(`SupplyChain contract deployed to: ${supplyChain.target}`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
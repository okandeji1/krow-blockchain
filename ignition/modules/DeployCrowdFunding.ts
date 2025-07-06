import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrowdFundingModule = buildModule("CrowdFundingModule", (m) => {
  const fundingGoal = 1000n * 10n ** 18n; // 1000 ETH in wei
  const oneMonthInSeconds = 30n * 24n * 60n * 60n;
  const deadline = BigInt(Math.floor(Date.now() / 1000)) + oneMonthInSeconds;

  const crowdFunding = m.contract("Crowdfunding", [
    fundingGoal,
    deadline
  ]);
  return { crowdFunding };
});

export default CrowdFundingModule;

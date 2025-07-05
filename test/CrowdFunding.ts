const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding", function () {
  let Crowdfunding, crowdfunding: { deployed: () => any; connect: (arg0: any) => { (): any; new(): any; contribute: { (arg0: { value: any; }): any; new(): any; }; refund: { (): any; new(): any; }; }; contributions: (arg0: any) => any; pause: () => any; resume: () => any; withdraw: () => any; }, owner: { address: any; }, addr1: { address: any; }, addr2;
  const fundingGoal = ethers.utils.parseEther("10");
  const duration = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy(fundingGoal, duration);
    await crowdfunding.deployed();
  });

  it("should accept contributions", async function () {
    await crowdfunding.connect(addr1).contribute({ value: ethers.utils.parseEther("1") });
    expect(await crowdfunding.contributions(addr1.address)).to.equal(ethers.utils.parseEther("1"));
  });

  it("should pause and resume contributions", async function () {
    await crowdfunding.pause();
    await expect(
      crowdfunding.connect(addr1).contribute({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Campaign is paused");

    await crowdfunding.resume();
    await crowdfunding.connect(addr1).contribute({ value: ethers.utils.parseEther("1") });
    expect(await crowdfunding.contributions(addr1.address)).to.equal(ethers.utils.parseEther("1"));
  });

  it("should allow owner to withdraw after goal is met", async function () {
    // Contribute enough
    await crowdfunding.connect(addr1).contribute({ value: ethers.utils.parseEther("10") });
    
    // Move time past deadline
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine");

    // Owner withdraws
    const balanceBefore = await ethers.provider.getBalance(owner.address);
    await crowdfunding.withdraw();
    const balanceAfter = await ethers.provider.getBalance(owner.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("should allow refund if goal not met", async function () {
    await crowdfunding.connect(addr1).contribute({ value: ethers.utils.parseEther("1") });

    // Move time past deadline
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine");

    await crowdfunding.connect(addr1).refund();
    expect(await crowdfunding.contributions(addr1.address)).to.equal(0);
  });

  it("should reject withdrawal if goal not met", async function () {
    await crowdfunding.connect(addr1).contribute({ value: ethers.utils.parseEther("1") });

    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine");

    await expect(crowdfunding.withdraw()).to.be.revertedWith("Funding goal not reached");
  });
});

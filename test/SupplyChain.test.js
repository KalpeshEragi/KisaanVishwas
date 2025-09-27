const { expect } = require("chai");
const { ethers } = require("hardhat"); // This works reliably in a CommonJS setup

describe("SupplyChain", function () {
  let SupplyChain;
  let supplyChain;
  let owner;
  let farmer;
  let distributor;

  beforeEach(async function () {
    // Get signers from Hardhat's local Ethereum network
    [owner, farmer, distributor] = await ethers.getSigners();

    // Get the contract factory for our SupplyChain contract
    SupplyChain = await ethers.getContractFactory("SupplyChain");
    
    // Deploy a new instance of the contract before each test
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();
  });

  // Test case 1: Test the creation of a new batch
  describe("Batch Creation", function () {
    it("Should allow a farmer to create a new batch", async function () {
      const produceName = "Organic Tomatoes";
      const origin = "Farm Fresh Fields";
      const qualityMetrics = "Grade A";

      const tx = await supplyChain.connect(farmer).createBatch(produceName, origin, qualityMetrics);
      
      await expect(tx)
        .to.emit(supplyChain, "BatchCreated")
        .withArgs(1, farmer.address, produceName);

      const batch = await supplyChain.batches(1);
      expect(batch.batchId).to.equal(1);
      expect(batch.produceName).to.equal(produceName);
      expect(batch.currentOwner).to.equal(farmer.address);
      
      const history = await supplyChain.getBatchHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(farmer.address);
    });
  });

  // Test case 2: Test the transfer of ownership
  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).createBatch("Organic Carrots", "Green Valley", "Certified Organic");
    });

    it("Should allow the current owner to transfer a batch", async function () {
      const tx = await supply-chain.connect(farmer).transferOwnership(1, distributor.address);

      await expect(tx)
        .to.emit(supplyChain, "OwnershipTransferred")
        .withArgs(1, farmer.address, distributor.address);

      const batch = await supplyChain.batches(1);
      expect(batch.currentOwner).to.equal(distributor.address);

      const history = await supplyChain.getBatchHistory(1);
      expect(history.length).to.equal(2);
      expect(history[1]).to.equal(distributor.address);
    });

    it("Should NOT allow a non-owner to transfer a batch", async function () {
      await expect(
        supplyChain.connect(distributor).transferOwnership(1, owner.address)
      ).to.be.revertedWith("Only the current owner can transfer.");
    });
    
    it("Should NOT allow transfer to the zero address", async function () {
       await expect(
        supplyChain.connect(farmer).transferOwnership(1, ethers.constants.AddressZero)
      ).to.be.revertedWith("Cannot transfer to the zero address.");
    });
  });
});
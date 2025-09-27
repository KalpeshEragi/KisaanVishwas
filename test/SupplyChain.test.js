// This is the NEW, correct ES Module syntax
import { expect } from "chai";
import { ethers } from "hardhat";

// Describe the test suite for the SupplyChain contract
describe("SupplyChain", function () {
  let SupplyChain;
  let supplyChain;
  let owner;
  let farmer;
  let distributor;

  // This block runs before each test ('it' block)
  beforeEach(async function () {
    // Get signers (accounts) from Hardhat's local Ethereum network
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

      // The farmer account calls the createBatch function
      const tx = await supplyChain.connect(farmer).createBatch(produceName, origin, qualityMetrics);
      
      // Check if the BatchCreated event was emitted with the correct arguments
      await expect(tx)
        .to.emit(supplyChain, "BatchCreated")
        .withArgs(1, farmer.address, produceName);

      // Verify the details of the newly created batch
      const batch = await supplyChain.batches(1);
      expect(batch.batchId).to.equal(1);
      expect(batch.produceName).to.equal(produceName);
      expect(batch.currentOwner).to.equal(farmer.address);
      
      // Verify the history started correctly
      const history = await supplyChain.getBatchHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(farmer.address);
    });
  });

  // Test case 2: Test the transfer of ownership
  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      // Create a batch first before testing transfer
      await supplyChain.connect(farmer).createBatch("Organic Carrots", "Green Valley", "Certified Organic");
    });

    it("Should allow the current owner to transfer a batch", async function () {
      // The farmer (current owner) transfers batch 1 to the distributor
      const tx = await supplyChain.connect(farmer).transferOwnership(1, distributor.address);

      // Check if the OwnershipTransferred event was emitted correctly
      await expect(tx)
        .to.emit(supplyChain, "OwnershipTransferred")
        .withArgs(1, farmer.address, distributor.address);

      // Check that the new owner is the distributor
      const batch = await supplyChain.batches(1);
      expect(batch.currentOwner).to.equal(distributor.address);

      // Check that the history has been updated
      const history = await supplyChain.getBatchHistory(1);
      expect(history.length).to.equal(2);
      expect(history[1]).to.equal(distributor.address);
    });

    it("Should NOT allow a non-owner to transfer a batch", async function () {
      // The distributor (not the owner) tries to transfer the batch.
      // We expect this transaction to be reverted.
      await expect(
        supplyChain.connect(distributor).transferOwnership(1, owner.address)
      ).to.be.revertedWith("Only the current owner can transfer.");
    });
    
    it("Should NOT allow transfer to the zero address", async function () {
      // Farmer tries to transfer to an invalid address
       await expect(
        supplyChain.connect(farmer).transferOwnership(1, ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot transfer to the zero address.");
    });
  });
});
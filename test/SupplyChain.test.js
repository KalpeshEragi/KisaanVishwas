// Import the 'expect' assertion library from Chai for writing test conditions.
const { expect } = require("chai");

// Import the 'ethers' library from Hardhat, which provides utilities to interact with Ethereum.
const { ethers } = require("hardhat");

// 'describe' creates a test suite, a container for a group of related tests.
// Here, we're creating a suite for our entire "SupplyChain" contract.
describe("SupplyChain", function () {
  // Declare variables that will be used across different tests.
  // This avoids re-declaring them in every single test case.
  let SupplyChain; // Will hold the contract factory.
  let supplyChain; // Will hold an instance of our deployed contract.
  let owner;       // The default account, typically the one that deploys the contract.
  let farmer;      // A simulated account representing a farmer.
  let distributor; // A simulated account representing a distributor.

  // 'beforeEach' is a hook that runs before every single 'it' test block in this suite.
  // This is perfect for setting up a clean state for each test, ensuring they don't affect each other.
  beforeEach(async function () {
    // Get signers (simulated accounts) from the Hardhat test network.
    // The first one is the default 'owner', the next two are assigned to 'farmer' and 'distributor'.
    [owner, farmer, distributor] = await ethers.getSigners();

    // Create a "factory" for our SupplyChain contract. This is an object that knows how to create
    // and deploy instances of our contract.
    SupplyChain = await ethers.getContractFactory("SupplyChain");

    // Deploy a new, fresh instance of the SupplyChain contract before each test.
    supplyChain = await SupplyChain.deploy();
    
    // Wait until the contract is fully deployed and mined on the local test network.
    await supplyChain.waitForDeployment();
  });

  // A nested 'describe' block to group all tests related to batch creation.
  describe("Batch Creation", function () {
    // 'it' defines an individual test case. The string describes what this specific test should do.
    it("Should allow a farmer to create a new batch", async function () {
      // ARRANGE: Define the input data for our new batch.
      const produceName = "Organic Tomatoes";
      const origin = "Farm Fresh Fields";
      const qualityMetrics = "Grade A";

      // ACT: Call the 'createBatch' function on the contract.
      // 'supplyChain.connect(farmer)' makes the 'farmer' account the msg.sender for this transaction.
      const tx = await supplyChain.connect(farmer).createBatch(produceName, origin, qualityMetrics);

      // ASSERT: Check that the transaction emitted the 'BatchCreated' event with the correct arguments.
      // This confirms our event logging is working.
      await expect(tx).to.emit(supplyChain, "BatchCreated").withArgs(1, farmer.address, produceName);

      // ASSERT: Retrieve the batch from the contract's public mapping to verify its state.
      const batch = await supplyChain.batches(1);
      expect(batch.batchId).to.equal(1);
      expect(batch.produceName).to.equal(produceName);
      expect(batch.currentOwner).to.equal(farmer.address);

      // ASSERT: Check the historical record to ensure the farmer was added as the first owner.
      const history = await supplyChain.getBatchHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(farmer.address);
    });
  });

  // A nested 'describe' block for all tests related to transferring ownership.
  describe("Ownership Transfer", function () {
    // This nested 'beforeEach' runs before each test *within this 'Ownership Transfer' block only*.
    // Its purpose is to create a batch so that the following tests have something to transfer.
    beforeEach(async function () {
      await supplyChain.connect(farmer).createBatch("Organic Carrots", "Green Valley", "Certified Organic");
    });

    // Test case for a successful transfer.
    it("Should allow the current owner to transfer a batch", async function () {
      // ACT: The farmer (current owner) transfers batch 1 to the distributor.
      const tx = await supplyChain.connect(farmer).transferOwnership(1, distributor.address);

      // ASSERT: Check that the correct event was emitted.
      await expect(tx).to.emit(supplyChain, "OwnershipTransferred").withArgs(1, farmer.address, distributor.address);

      // ASSERT: Verify that the batch's current owner has been updated to the distributor.
      const batch = await supplyChain.batches(1);
      expect(batch.currentOwner).to.equal(distributor.address);

      // ASSERT: Verify that the distributor has been added to the ownership history.
      const history = await supplyChain.getBatchHistory(1);
      expect(history.length).to.equal(2);
      expect(history[1]).to.equal(distributor.address);
    });

    // Test case for a failed transfer attempt by a non-owner.
    it("Should NOT allow a non-owner to transfer a batch", async function () {
      // ACT & ASSERT: We expect this transaction to fail ('be.revertedWith').
      // The distributor, who is not the owner, attempts the transfer.
      // We check that it fails with the exact error message from our contract's 'require' statement.
      await expect(
        supplyChain.connect(distributor).transferOwnership(1, owner.address)
      ).to.be.revertedWith("Only the current owner can transfer.");
    });
    
    // Test case for a failed transfer attempt to the invalid "zero address".
    it("Should NOT allow transfer to the zero address", async function () {
      // The "zero address" is an invalid address in Ethereum.
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      // ACT & ASSERT: We expect this to be reverted with our specific error message.
      await expect(
        supplyChain.connect(farmer).transferOwnership(1, zeroAddress)
      ).to.be.revertedWith("Cannot transfer to the zero address.");
    });
  });
});

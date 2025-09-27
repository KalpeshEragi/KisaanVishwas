// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain
 * @dev A smart contract to track agricultural produce from farm to consumer.
 * It allows for the creation of product batches, transfer of ownership,
 * and retrieval of the full history of a batch, ensuring transparency.
 */
contract SupplyChain {
    /**
     * @dev A counter to ensure each batch gets a unique ID.
     * It's private to prevent external contracts from manipulating it.
     */
    uint256 private batchCounter;

    /**
     * @dev Represents a single batch of produce in the supply chain.
     * Each batch has a unique ID, descriptive details, a current owner,
     * and a creation timestamp.
     */
    struct Batch {
        uint256 batchId;         // Unique identifier for the batch
        string produceName;      // Name of the produce (e.g., "Organic Tomatoes")
        string origin;           // The farm or location of origin
        string qualityMetrics;   // Metrics like "Grade A", "Organic Certified"
        address payable currentOwner; // The Ethereum address of the current stakeholder
        uint256 timestamp;       // Timestamp of when the batch was created
    }

    /**
     * @dev A mapping from a batch ID to its corresponding Batch struct.
     * This allows for efficient retrieval of batch details.
     */
    mapping(uint256 => Batch) public batches;

    /**
     * @dev A mapping to store the chain of custody for each batch.
     * The key is the batch ID, and the value is an array of addresses
     * representing the stakeholders who have owned the batch.
     */
    mapping(uint256 => address[]) public batchHistory;

    //- EVENTS -//

    /**
     * @dev Emitted when a new batch of produce is created and added to the supply chain.
     * @param batchId The unique ID of the newly created batch.
     * @param farmer The address of the farmer who created the batch.
     * @param produceName The name of the produce.
     */
    event BatchCreated(uint256 indexed batchId, address indexed farmer, string produceName);

    /**
     * @dev Emitted when the ownership of a batch is transferred to a new stakeholder.
     * @param batchId The ID of the batch being transferred.
     * @param from The address of the previous owner.
     * @param to The address of the new owner.
     */
    event OwnershipTransferred(uint256 indexed batchId, address indexed from, address indexed to);

    //- FUNCTIONS -//

    /**
     * @dev Creates a new batch of produce.
     * Only callable by an external account (e.g., a farmer).
     * The caller (msg.sender) becomes the initial owner.
     * @param _produceName The name of the produce.
     * @param _origin The origin farm/location.
     * @param _qualityMetrics A description of the produce quality.
     */
    function createBatch(string memory _produceName, string memory _origin, string memory _qualityMetrics) public {
        // Increment the counter to get a new unique ID
        batchCounter++;
        uint256 newBatchId = batchCounter;

        // Create the new Batch struct in storage
        batches[newBatchId] = Batch({
            batchId: newBatchId,
            produceName: _produceName,
            origin: _origin,
            qualityMetrics: _qualityMetrics,
            currentOwner: payable(msg.sender), // The creator is the first owner
            timestamp: block.timestamp
        });

        // Start the history trail with the creator's address
        batchHistory[newBatchId].push(msg.sender);

        // Emit an event to log the creation on the blockchain
        emit BatchCreated(newBatchId, msg.sender, _produceName);
    }

    /**
     * @dev Transfers a batch to a new owner.
     * @notice Only the current owner of the batch can call this function.
     * @param _batchId The ID of the batch to transfer.
     * @param _newOwner The address of the new stakeholder.
     */
    function transferOwnership(uint256 _batchId, address payable _newOwner) public {
        // 1. Validation: Ensure the batch exists (owner is not the zero address).
        require(batches[_batchId].currentOwner != address(0), "Batch does not exist.");

        // 2. Authorization: Ensure the person calling is the current owner.
        require(msg.sender == batches[_batchId].currentOwner, "Only the current owner can transfer.");

        // 3. Validation: Ensure the new owner is not the zero address.
        require(_newOwner != address(0), "Cannot transfer to the zero address.");

        // Update the current owner of the batch
        batches[_batchId].currentOwner = _newOwner;

        // Add the new owner to the batch's history
        batchHistory[_batchId].push(_newOwner);

        // Emit an event to log the transfer
        emit OwnershipTransferred(_batchId, msg.sender, _newOwner);
    }
    
    /**
     * @dev Retrieves the full ownership history of a specific batch.
     * This is a view function, so it doesn't cost any gas to call.
     * @param _batchId The ID of the batch to trace.
     * @return A memory array of addresses representing the chain of custody.
     */
    function getBatchHistory(uint256 _batchId) public view returns (address[] memory) {
        return batchHistory[_batchId];
    }
}
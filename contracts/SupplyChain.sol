// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain (Upgraded)
 * @dev A smart contract to track agricultural produce with price and quantity.
 * It allows for the creation of batches and tracks the price at each transfer,
 * creating a transparent price progression history for consumers.
 */
contract SupplyChain {
    uint256 private batchCounter;

    /**
     * @dev Represents a single batch of produce in the supply chain.
     * Now includes initial quantity and the price it was created at.
     */
    struct Batch {
        uint256 batchId;
        string produceName;
        string origin;
        string qualityMetrics;
        address payable currentOwner;
        uint256 timestamp;
        uint256 quantity; // the initial quantity of the batch (e.g., in kg)
    }

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => address[]) public batchHistory;

    /**
     * @dev NEW: A mapping to store the price progression for each batch.
     * The key is the batch ID, and the value is an array of prices (per unit)
     * corresponding to each step in the ownership history.
     */
    mapping(uint256 => uint256[]) public priceHistory;

    // --- EVENTS --- //

    event BatchCreated(
        uint256 indexed batchId,
        address indexed farmer,
        string produceName,
        uint256 quantity,
        uint256 pricePerUnit
    );

    event OwnershipTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        uint256 pricePerUnit
    );

    // --- FUNCTIONS --- //

    /**
     * @dev Creates a new batch of produce with initial quantity and price.
     * @param _produceName The name of the produce.
     * @param _origin The origin farm/location.
     * @param _qualityMetrics A description of the produce quality.
     * @param _quantity The initial quantity of the batch (e.g., 500 for 500kg).
     * @param _pricePerUnit The initial sale price from the farmer (e.g., 20 for ₹20/kg).
     */
    function createBatch(
        string memory _produceName,
        string memory _origin,
        string memory _qualityMetrics,
        uint256 _quantity,
        uint256 _pricePerUnit
    ) public {
        batchCounter++;
        uint256 newBatchId = batchCounter;

        batches[newBatchId] = Batch({
            batchId: newBatchId,
            produceName: _produceName,
            origin: _origin,
            qualityMetrics: _qualityMetrics,
            currentOwner: payable(msg.sender),
            timestamp: block.timestamp,
            quantity: _quantity // Set initial quantity
        });

        batchHistory[newBatchId].push(msg.sender);
        priceHistory[newBatchId].push(_pricePerUnit); // Log the initial price

        emit BatchCreated(newBatchId, msg.sender, _produceName, _quantity, _pricePerUnit);
    }

    /**
     * @dev Transfers a batch to a new owner and records the sale price.
     * @param _batchId The ID of the batch to transfer.
     * @param _newOwner The address of the new stakeholder.
     * @param _pricePerUnit The price at which this transfer/sale is occurring.
     */
    function transferOwnership(uint256 _batchId, address payable _newOwner, uint256 _pricePerUnit) public {
        require(batches[_batchId].currentOwner != address(0), "Batch does not exist.");
        require(msg.sender == batches[_batchId].currentOwner, "Only the current owner can transfer.");
        require(_newOwner != address(0), "Cannot transfer to the zero address.");

        batches[_batchId].currentOwner = _newOwner;
        batchHistory[_batchId].push(_newOwner);
        priceHistory[_batchId].push(_pricePerUnit); // Log the new sale price

        emit OwnershipTransferred(_batchId, msg.sender, _newOwner, _pricePerUnit);
    }
    
    /**
     * @dev Retrieves the full ownership history of a specific batch.
     */
    function getBatchHistory(uint256 _batchId) public view returns (address[] memory) {
        return batchHistory[_batchId];
    }

    /**
     * @dev Retrieves the full price progression of a specific batch.
     */
    function getPriceHistory(uint256 _batchId) public view returns (uint256[] memory) {
        return priceHistory[_batchId];
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ParcelEscrow
 * @dev Smart contract for decentralized peer-to-peer delivery platform
 * @notice This contract handles escrow payments for delivery services on Avalanche network
 */
contract ParcelEscrow {
    address public owner;

    struct Delivery {
        address payable sender;
        address payable driver;
        string fromAddress;
        string toAddress;
        string itemDescription;
        uint256 itemValue;
        uint256 deliveryFee;
        uint256 escrowAmount;
        Status status;
        uint256 createdAt;
        uint256 acceptedAt;
        uint256 deliveredAt;
    }

    enum Status { 
        Pending,    // 0 - Delivery created, waiting for driver
        Accepted,   // 1 - Driver accepted the delivery
        InTransit,  // 2 - Package is in transit
        Delivered,  // 3 - Package delivered, funds released
        Cancelled   // 4 - Delivery cancelled
    }

    mapping(uint256 => Delivery) public deliveries;
    uint256 public deliveryCounter;

    // Events for frontend integration
    event DeliveryCreated(
        uint256 indexed deliveryId, 
        address indexed sender, 
        uint256 fee,
        string fromAddress,
        string toAddress,
        string itemDescription
    );
    
    event DeliveryAccepted(
        uint256 indexed deliveryId, 
        address indexed driver,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        uint256 indexed deliveryId,
        uint256 timestamp
    );
    
    event FundsReleased(
        uint256 indexed deliveryId, 
        address indexed driver, 
        uint256 amount,
        uint256 timestamp
    );

    event DeliveryCancelled(
        uint256 indexed deliveryId,
        address indexed cancelledBy,
        uint256 refundAmount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlySender(uint256 _deliveryId) {
        require(msg.sender == deliveries[_deliveryId].sender, "Only sender can call this function");
        _;
    }

    modifier onlyDriver(uint256 _deliveryId) {
        require(msg.sender == deliveries[_deliveryId].driver, "Only assigned driver can call this function");
        _;
    }

    modifier validDelivery(uint256 _deliveryId) {
        require(_deliveryId > 0 && _deliveryId <= deliveryCounter, "Invalid delivery ID");
        _;
    }

    constructor() {
        owner = msg.sender;
        deliveryCounter = 0;
    }

    /**
     * @dev Create a new delivery request with escrow payment
     * @param _fromAddress Pickup location
     * @param _toAddress Delivery destination
     * @param _itemDescription Description of the item to be delivered
     * @param _itemValue Value of the item in wei
     * @param _deliveryFee Delivery fee in wei
     */
    function createDelivery(
        string memory _fromAddress,
        string memory _toAddress,
        string memory _itemDescription,
        uint256 _itemValue,
        uint256 _deliveryFee
    ) external payable {
        require(bytes(_fromAddress).length > 0, "From address cannot be empty");
        require(bytes(_toAddress).length > 0, "To address cannot be empty");
        require(bytes(_itemDescription).length > 0, "Item description cannot be empty");
        require(_deliveryFee > 0, "Delivery fee must be greater than 0");
        require(msg.value == _deliveryFee, "Sent AVAX must match delivery fee");

        deliveryCounter++;
        
        deliveries[deliveryCounter] = Delivery({
            sender: payable(msg.sender),
            driver: payable(address(0)),
            fromAddress: _fromAddress,
            toAddress: _toAddress,
            itemDescription: _itemDescription,
            itemValue: _itemValue,
            deliveryFee: _deliveryFee,
            escrowAmount: msg.value,
            status: Status.Pending,
            createdAt: block.timestamp,
            acceptedAt: 0,
            deliveredAt: 0
        });

        emit DeliveryCreated(
            deliveryCounter, 
            msg.sender, 
            _deliveryFee,
            _fromAddress,
            _toAddress,
            _itemDescription
        );
    }

    /**
     * @dev Driver accepts a delivery request
     * @param _deliveryId ID of the delivery to accept
     */
    function acceptDelivery(uint256 _deliveryId) external validDelivery(_deliveryId) {
        Delivery storage delivery = deliveries[_deliveryId];
        require(delivery.status == Status.Pending, "Delivery not available for acceptance");
       

        delivery.driver = payable(msg.sender);
        delivery.status = Status.Accepted;
        delivery.acceptedAt = block.timestamp;

        emit DeliveryAccepted(_deliveryId, msg.sender, block.timestamp);
    }

    /**
     * @dev Update delivery status to InTransit (called by driver)
     * @param _deliveryId ID of the delivery
     */
    function startTransit(uint256 _deliveryId) external validDelivery(_deliveryId) onlyDriver(_deliveryId) {
        Delivery storage delivery = deliveries[_deliveryId];
        require(delivery.status == Status.Accepted, "Delivery must be accepted first");

        delivery.status = Status.InTransit;
    }

    /**
     * @dev Confirm delivery completion and release funds to driver
     * @param _deliveryId ID of the delivery to confirm
     */
    function confirmDelivery(uint256 _deliveryId) external validDelivery(_deliveryId) onlySender(_deliveryId) {
        Delivery storage delivery = deliveries[_deliveryId];
        require(
            delivery.status == Status.Accepted || delivery.status == Status.InTransit, 
            "Delivery not in progress"
        );
        require(delivery.driver != address(0), "No driver assigned");

        delivery.status = Status.Delivered;
        delivery.deliveredAt = block.timestamp;

        // Transfer escrow amount to driver
        uint256 amount = delivery.escrowAmount;
        delivery.escrowAmount = 0; // Prevent reentrancy

        (bool success, ) = delivery.driver.call{value: amount}("");
        require(success, "Transfer to driver failed");

        emit DeliveryConfirmed(_deliveryId, block.timestamp);
        emit FundsReleased(_deliveryId, delivery.driver, amount, block.timestamp);
    }

    /**
     * @dev Cancel delivery and refund sender (only if no driver assigned)
     * @param _deliveryId ID of the delivery to cancel
     */
    function cancelDelivery(uint256 _deliveryId) external validDelivery(_deliveryId) onlySender(_deliveryId) {
        Delivery storage delivery = deliveries[_deliveryId];
        require(delivery.status == Status.Pending, "Can only cancel pending deliveries");

        delivery.status = Status.Cancelled;
        
        uint256 refundAmount = delivery.escrowAmount;
        delivery.escrowAmount = 0; // Prevent reentrancy

        (bool success, ) = delivery.sender.call{value: refundAmount}("");
        require(success, "Refund to sender failed");

        emit DeliveryCancelled(_deliveryId, msg.sender, refundAmount);
    }

    /**
     * @dev Emergency cancel by owner (with refund to sender)
     * @param _deliveryId ID of the delivery to cancel
     */
    function emergencyCancel(uint256 _deliveryId) external validDelivery(_deliveryId) onlyOwner {
        Delivery storage delivery = deliveries[_deliveryId];
        require(delivery.status != Status.Delivered, "Cannot cancel delivered package");
        require(delivery.status != Status.Cancelled, "Already cancelled");

        delivery.status = Status.Cancelled;
        
        uint256 refundAmount = delivery.escrowAmount;
        delivery.escrowAmount = 0; // Prevent reentrancy

        (bool success, ) = delivery.sender.call{value: refundAmount}("");
        require(success, "Emergency refund failed");

        emit DeliveryCancelled(_deliveryId, msg.sender, refundAmount);
    }

    /**
     * @dev Get delivery details
     * @param _deliveryId ID of the delivery
     * @return Delivery struct
     */
    function getDelivery(uint256 _deliveryId) external view validDelivery(_deliveryId) returns (Delivery memory) {
        return deliveries[_deliveryId];
    }

    /**
     * @dev Get all deliveries for a specific sender
     * @param _sender Address of the sender
     * @return Array of delivery IDs
     */
    function getDeliveriesBySender(address _sender) external view returns (uint256[] memory) {
        uint256[] memory senderDeliveries = new uint256[](deliveryCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= deliveryCounter; i++) {
            if (deliveries[i].sender == _sender) {
                senderDeliveries[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = senderDeliveries[i];
        }

        return result;
    }

    /**
     * @dev Get all deliveries for a specific driver
     * @param _driver Address of the driver
     * @return Array of delivery IDs
     */
    function getDeliveriesByDriver(address _driver) external view returns (uint256[] memory) {
        uint256[] memory driverDeliveries = new uint256[](deliveryCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= deliveryCounter; i++) {
            if (deliveries[i].driver == _driver) {
                driverDeliveries[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = driverDeliveries[i];
        }

        return result;
    }

    /**
     * @dev Get all pending deliveries (available for drivers)
     * @return Array of delivery IDs
     */
    function getPendingDeliveries() external view returns (uint256[] memory) {
        uint256[] memory pendingDeliveries = new uint256[](deliveryCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= deliveryCounter; i++) {
            if (deliveries[i].status == Status.Pending) {
                pendingDeliveries[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pendingDeliveries[i];
        }

        return result;
    }

    /**
     * @dev Get contract balance (for owner)
     * @return Contract balance in wei
     */
    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get delivery statistics
     * @return total Total number of deliveries
     * @return pending Number of pending deliveries
     * @return accepted Number of accepted deliveries
     * @return inTransit Number of deliveries in transit
     * @return delivered Number of delivered packages
     * @return cancelled Number of cancelled deliveries
     */
    function getDeliveryStats() external view returns (
        uint256 total,
        uint256 pending,
        uint256 accepted,
        uint256 inTransit,
        uint256 delivered,
        uint256 cancelled
    ) {
        total = deliveryCounter;
        
        for (uint256 i = 1; i <= deliveryCounter; i++) {
            if (deliveries[i].status == Status.Pending) pending++;
            else if (deliveries[i].status == Status.Accepted) accepted++;
            else if (deliveries[i].status == Status.InTransit) inTransit++;
            else if (deliveries[i].status == Status.Delivered) delivered++;
            else if (deliveries[i].status == Status.Cancelled) cancelled++;
        }
    }

    /**
     * @dev Fallback function to reject direct payments
     */
    receive() external payable {
        revert("Direct payments not accepted. Use createDelivery function.");
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }
}
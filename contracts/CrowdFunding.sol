// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    address public owner;
    uint public fundingGoal;
    uint public deadline;
    uint public totalContributed;
    bool public paused;

    mapping(address => uint) public contributions;

    event Contribution(address indexed contributor, uint amount);
    event Withdrawal(address indexed owner, uint amount);
    event Refund(address indexed contributor, uint amount);
    event Paused();
    event Resumed();

    constructor(uint _fundingGoal, uint _deadline) {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in future");

        owner = msg.sender;
        fundingGoal = _fundingGoal;
        deadline = _deadline;
        paused = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier notPaused() {
        require(!paused, "Campaign is paused");
        _;
    }

    struct ContributionStruct {
        address contributor;
        uint amount;
        uint timestamp;
    }

    ContributionStruct[] public contributors;

    function contribute() external payable notPaused {
        require(block.timestamp < deadline, "Crowdfunding deadline passed");
        require(msg.value > 0, "Contribution must be greater than 0");

        contributors.push(
            ContributionStruct({
                contributor: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );
        contributions[msg.sender] += msg.value;
        totalContributed += msg.value;

        emit Contribution(msg.sender, msg.value);
    }

    function withdraw() external onlyOwner {
        require(block.timestamp >= deadline, "Cannot withdraw before deadline");
        require(totalContributed >= fundingGoal, "Funding goal not reached");

        uint amount = address(this).balance;
        if (amount == 0) {
            revert("No funds to withdraw");
        }

        (bool success, ) = owner.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner, amount);
    }

    function refund() external onlyOwner {
        require(
            block.timestamp >= deadline,
            "Refunds available after deadline"
        );
        require(totalContributed < fundingGoal, "Goal was met, no refunds");

        uint amount = contributions[msg.sender];
        require(amount > 0, "No contribution to refund");

        contributions[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Refund failed");

        emit Refund(msg.sender, amount);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function resume() external onlyOwner {
        paused = false;
        emit Resumed();
    }

    function setDeadline(uint _deadline) external onlyOwner {
        require(_deadline > block.timestamp, "Deadline must be in future");
        deadline = _deadline;
    }

    function getTimeLeft() public view returns (uint) {
        if (block.timestamp >= deadline) {
            return 0;
        }
        return deadline - block.timestamp;
    }

    function getContributors()
        public
        view
        returns (ContributionStruct[] memory)
    {
        return contributors;
    }
}

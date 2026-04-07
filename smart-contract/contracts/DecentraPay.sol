// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DecentraPay {
    uint8 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "ReentrancyGuard: reentrant call");
        _locked = 2; _; _locked = 1;
    }

    address public immutable owner;
    uint256 public totalVolume;
    mapping(address => uint256) public totalSent;
    mapping(address => uint256) public totalReceived;
    mapping(address => uint256) public txCount;

    event PaymentSent(address indexed from, address indexed to, uint256 amount, string message, uint256 timestamp);
    event SplitPayment(address sender, address payable[] recipients, uint[] amounts, string note, uint timestamp);

    error ZeroValue(); error ZeroAddress(); error MessageTooLong();
    error TransferFailed(); error ArrayLengthMismatch(); error EmptyRecipients(); error ValueMismatch();

    constructor() { owner = msg.sender; }

    function sendPayment(address payable recipient, string calldata message) external payable nonReentrant {
        if (msg.value == 0)              revert ZeroValue();
        if (recipient == address(0))     revert ZeroAddress();
        if (bytes(message).length > 256) revert MessageTooLong();
        totalVolume             += msg.value;
        totalSent[msg.sender]   += msg.value;
        totalReceived[recipient]+= msg.value;
        txCount[msg.sender]     += 1;
        emit PaymentSent(msg.sender, recipient, msg.value, message, block.timestamp);
        (bool ok, ) = recipient.call{value: msg.value}("");
        if (!ok) revert TransferFailed();
    }

    function splitPayment(address payable[] calldata recipients, uint256[] calldata amounts, string calldata groupNote)
        external payable nonReentrant
    {
        if (recipients.length == 0)              revert EmptyRecipients();
        if (recipients.length != amounts.length) revert ArrayLengthMismatch();
        uint256 total;
        for (uint256 i; i < amounts.length; ) { total += amounts[i]; unchecked{++i;} }
        if (total != msg.value) revert ValueMismatch();
        totalVolume           += msg.value;
        totalSent[msg.sender] += msg.value;
        txCount[msg.sender]   += 1;
        emit SplitPayment(msg.sender, recipients, amounts, groupNote, block.timestamp);
        for (uint256 i; i < recipients.length; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            totalReceived[recipients[i]] += amounts[i];
            emit PaymentSent(msg.sender, recipients[i], amounts[i], groupNote, block.timestamp);
            (bool ok, ) = recipients[i].call{value: amounts[i]}("");
            if (!ok) revert TransferFailed();
            unchecked{++i;}
        }
    }

    function walletStats(address wallet) external view returns (uint256 sent, uint256 received, uint256 count) {
        return (totalSent[wallet], totalReceived[wallet], txCount[wallet]);
    }

    receive() external payable {}
}

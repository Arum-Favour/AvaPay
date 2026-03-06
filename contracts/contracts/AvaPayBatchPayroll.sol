// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title AvaPayBatchPayroll
 * @notice Minimal MVP: owner-controlled vault that can execute batch payouts
 *         in either native AVAX (token == address(0)) or an ERC20 token.
 */
contract AvaPayBatchPayroll {
    address public owner;
    address public immutable token;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Deposited(address indexed from, address indexed token, uint256 amount);
    event Paid(address indexed recipient, address indexed token, uint256 amount);
    event PayBatch(address indexed executor, address indexed token, uint256 total, uint256 count);

    error NotOwner();
    error InvalidArrayLengths();
    error InvalidRecipient();
    error TransferFailed();
    error InsufficientValue();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _token, address _owner) {
        token = _token;
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    receive() external payable {
        emit Deposited(msg.sender, address(0), msg.value);
    }

    function depositERC20(uint256 amount) external onlyOwner {
        if (token == address(0)) revert TransferFailed();
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit Deposited(msg.sender, token, amount);
    }

    function payBatch(address[] calldata recipients, uint256[] calldata amounts) external payable onlyOwner {
        uint256 len = recipients.length;
        if (len != amounts.length) revert InvalidArrayLengths();

        uint256 total = 0;
        for (uint256 i = 0; i < len; i++) {
            address to = recipients[i];
            if (to == address(0)) revert InvalidRecipient();
            uint256 amount = amounts[i];
            total += amount;

            if (token == address(0)) {
                (bool sent, ) = to.call{value: amount}("");
                if (!sent) revert TransferFailed();
            } else {
                bool ok = IERC20(token).transfer(to, amount);
                if (!ok) revert TransferFailed();
            }

            emit Paid(to, token, amount);
        }

        if (token == address(0) && msg.value != total) revert InsufficientValue();
        emit PayBatch(msg.sender, token, total, len);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidRecipient();
        if (token == address(0)) {
            (bool sent, ) = to.call{value: amount}("");
            if (!sent) revert TransferFailed();
        } else {
            bool ok = IERC20(token).transfer(to, amount);
            if (!ok) revert TransferFailed();
        }
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidRecipient();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function balance() external view returns (uint256) {
        if (token == address(0)) return address(this).balance;
        return IERC20(token).balanceOf(address(this));
    }
}


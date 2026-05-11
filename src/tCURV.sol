// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title tCURV Token
 * @notice Standard ERC20 token for Curv Protocol (Test Mainnet Launch)
 * @dev Optimized for gas efficiency by using standard OZ implementation.
 */
contract TCurvToken is ERC20, Ownable {
    constructor() ERC20("Test CURV", "tCURV") Ownable(msg.sender) {
        // Initial mint to the deployer (1,000,000 tokens)
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @notice Allows the owner to mint more tokens if needed (e.g., for liquidity)
     * @param to The address to receive the tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

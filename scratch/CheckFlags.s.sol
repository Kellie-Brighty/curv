// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

contract CheckFlags is Script {
    function run() public view {
        console.log("BEFORE_REMOVE_LIQUIDITY_FLAG:", Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG);
        console.log("BEFORE_DONATE_FLAG:", Hooks.BEFORE_DONATE_FLAG);
        console.log("AFTER_ADD_LIQUIDITY_FLAG:", Hooks.AFTER_ADD_LIQUIDITY_FLAG);
        console.log("BEFORE_SWAP_FLAG:", Hooks.BEFORE_SWAP_FLAG);
        
        uint160 target = uint160(Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.BEFORE_DONATE_FLAG);
        console.log("Target (Remove + Donate):", target);
        
        uint160 target2 = uint160(Hooks.AFTER_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_SWAP_FLAG);
        console.log("Target (Add + Swap):", target2);
    }
}

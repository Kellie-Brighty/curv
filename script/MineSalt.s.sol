// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {Lo0pLarp} from "../src/Lo0pLarp.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

contract MineSalt is Script {
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    address constant POOL_MANAGER = 0x1F98000000000000000000000000000000000004;
    address constant CURV_TOKEN = 0x0b5702A3000A3ae3e80C3dfD6Be547c4325f7EB9;

    function run() public view {
        uint160 flags = uint160(Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.BEFORE_DONATE_FLAG);
        
        bytes memory constructorArgs = abi.encode(POOL_MANAGER, 0x7F715188103A3eD506E9dd95f918148B93875b22);
        
        console.log("Mining salt for flags: 0x480...");
        
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(Lo0pLarp).creationCode,
            constructorArgs
        );
        
        console.log("Found Salt:", vm.toString(salt));
        console.log("Hook Address:", hookAddress);
    }
}

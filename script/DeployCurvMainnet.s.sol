// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {Lo0pLarp} from "../src/Lo0pLarp.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";

/**
 * @title DeployCurvMainnet
 * @notice Production deployment script for Curv Protocol on Ethereum Mainnet.
 */
contract DeployCurvMainnet is Script {
    // Canonical Uniswap V4 PoolManager Address
    address constant POOL_MANAGER = 0x1F98000000000000000000000000000000000004;
    
    // Official CURV Token Address (Mainnet)
    address constant CURV_TOKEN = 0xB9aC1186AE06f1bC31274612C1AdBB9eC6040AA9; // Replace with actual Mainnet address
    
    // Uniswap CREATE2 Proxy
    address constant CREATE2_PROXY = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Preparing Mainnet Deployment...");
        console.log("Deployer:", deployerAddress);
        console.log("PoolManager:", POOL_MANAGER);
        console.log("CURV Token:", CURV_TOKEN);
        
        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Mine Hook Address
        // Required flags: AFTER_ADD_LIQUIDITY (1 << 10) | BEFORE_SWAP (1 << 7)
        uint160 flags = uint160(Hooks.AFTER_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_SWAP_FLAG);
        
        bytes memory constructorArgs = abi.encode(POOL_MANAGER, CURV_TOKEN);
        
        console.log("Mining production salt...");
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_PROXY,
            flags,
            type(Lo0pLarp).creationCode,
            constructorArgs
        );

        console.log("Production Hook Address:", hookAddress);
        console.log("Production Salt:", vm.toString(salt));

        // Step 2: Deploy Hook
        Lo0pLarp hook = new Lo0pLarp{salt: salt}(IPoolManager(POOL_MANAGER), CURV_TOKEN);
        
        // Step 3: Transfer ownership to a Multi-sig or Timelock if needed
        // hook.transferOwnership(address(0x...));

        vm.stopBroadcast();

        console.log("-----------------------------------------");
        console.log("MAINNET DEPLOYMENT PREPARED");
        console.log("HOOK:", address(hook));
        console.log("-----------------------------------------");
    }
}

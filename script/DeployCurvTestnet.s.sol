// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {Lo0pLarp} from "../src/Lo0pLarp.sol";
import {MockCURV} from "../src/test/MockCURV.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";

contract DeployCurvTestnet is Script {
    // Sepolia PoolManager Address (Official)
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    
    // Standard Uniswap CREATE2 Proxy address
    address constant CREATE2_PROXY = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deploying from:", deployerAddress);
        
        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy MockCURV
        MockCURV token = new MockCURV();
        console.log("MockCURV deployed at:", address(token));

        // Step 2: Mine a valid salt for the Hook
        // flags: afterAddLiquidity (1 << 10) | beforeSwap (1 << 7)
        uint160 flags = uint160(Hooks.AFTER_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_SWAP_FLAG);
        
        bytes memory constructorArgs = abi.encode(POOL_MANAGER, address(token));
        
        console.log("Mining valid hook address...");
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_PROXY,
            flags,
            type(Lo0pLarp).creationCode,
            constructorArgs
        );

        console.log("Mined Hook Address:", hookAddress);
        console.log("Mined Salt:");
        console.logBytes32(salt);

        // Step 3: Deploy Lo0pLarp (Hook) with the mined salt
        Lo0pLarp hook = new Lo0pLarp{salt: salt}(IPoolManager(POOL_MANAGER), address(token));
        console.log("Lo0pLarp Hook deployed at:", address(hook));

        // Step 4: Mint 1,000,000 tCURV explicitly to the deployerAddress
        token.mint(deployerAddress, 1_000_000 * 10**18);
        console.log("Minted 1,000,000 tCURV to:", deployerAddress);

        // Step 5: Transfer 400,000 tCURV to the Hook (Borrowing Reserve)
        token.transfer(address(hook), 400_000 * 10**18);
        console.log("Transferred 400,000 tCURV from deployer to Hook reserve.");

        vm.stopBroadcast();

        console.log("-----------------------------------------");
        console.log("DEPLOYMENT COMPLETE");
        console.log("TOKEN:", address(token));
        console.log("HOOK:", address(hook));
        console.log("NEW SALT:", vm.toString(salt));
        console.log("-----------------------------------------");
    }
}

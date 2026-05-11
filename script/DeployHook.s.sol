// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Lo0pLarp} from "../src/Lo0pLarp.sol";

contract DeployHook is Script {
    // Mainnet PoolManager
    address constant POOL_MANAGER = 0x1F98000000000000000000000000000000000004;
    
    // The salt we mined for the 0x480 suffix
    bytes32 constant SALT = 0x0000000000000000000000000000000000000000000000000000000000000b42;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Lo0pLarp with the specific salt and PoolManager address + Owner
        Lo0pLarp hook = new Lo0pLarp{salt: SALT}(IPoolManager(POOL_MANAGER), 0x7F715188103A3eD506E9dd95f918148B93875b22);
        
        console.log("Hook Deployed at:", address(hook));
        
        vm.stopBroadcast();
    }
}

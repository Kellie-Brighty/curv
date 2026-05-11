// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

contract InitializePool is Script {
    using CurrencyLibrary for Currency;

    address constant POOL_MANAGER = 0x1F98000000000000000000000000000000000004;
    address constant TCURV = 0x0b5702A3000A3ae3e80C3dfD6Be547c4325f7EB9;
    address constant HOOK = 0x9aBaF0c81b8fE2cEc962163Eb11731a76F0dC480;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        IPoolManager manager = IPoolManager(POOL_MANAGER);

        PoolKey memory key = PoolKey({
            currency0: CurrencyLibrary.ADDRESS_ZERO,
            currency1: Currency.wrap(TCURV),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        uint160 sqrtPriceX96 = 79228162514264337593543950336; // tick 0

        int24 tick = manager.initialize(key, uint160(sqrtPriceX96));
        
        console.log("Pool initialized at tick:", tick);
        
        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {LiquidityAmounts} from "@uniswap/v4-periphery/src/libraries/LiquidityAmounts.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

contract SeedLiquidity is Script, IUnlockCallback {
    using CurrencyLibrary for Currency;

    address constant POOL_MANAGER = 0x1F98000000000000000000000000000000000004;
    address constant TCURV = 0x0b5702A3000A3ae3e80C3dfD6Be547c4325f7EB9;
    address constant HOOK = 0xe16Af6E33266e572BbcaDB288bf3893942cd8220;

    IPoolManager manager = IPoolManager(POOL_MANAGER);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Approve PoolManager to spend tCURV
        IERC20(TCURV).approve(POOL_MANAGER, 10_000 * 10**18);

        PoolKey memory key = PoolKey({
            currency0: CurrencyLibrary.ADDRESS_ZERO,
            currency1: Currency.wrap(TCURV),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        // Initialize at tick 0 (1:1 ratio for simplicity in this seed)
        // Note: Slot0 should already be initialized from your previous cast command.
        
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // tick 0
        uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            TickMath.getSqrtPriceAtTick(-600),
            TickMath.getSqrtPriceAtTick(600),
            0.02 ether,
            10_000 * 10**18
        );

        manager.unlock(abi.encode(key, liquidity));
        
        vm.stopBroadcast();
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == POOL_MANAGER);
        (PoolKey memory key, uint128 liquidity) = abi.decode(data, (PoolKey, uint128));

        (BalanceDelta delta, ) = manager.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -600,
                tickUpper: 600,
                liquidityDelta: int256(uint256(liquidity)),
                salt: 0
            }),
            ""
        );

        // Settle currency0 (ETH)
        if (delta.amount0() < 0) {
            uint256 amount = uint256(uint128(-delta.amount0()));
            manager.sync(key.currency0);
            manager.settle{value: amount}();
        }

        // Settle currency1 (tCURV)
        if (delta.amount1() < 0) {
            uint256 amount = uint256(uint128(-delta.amount1()));
            manager.sync(key.currency1);
            IERC20(TCURV).transfer(address(manager), amount);
            manager.settle();
        }

        return "";
    }
}

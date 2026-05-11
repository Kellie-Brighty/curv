// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {SwapParams, ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {FixedPoint96} from "@uniswap/v4-core/src/libraries/FixedPoint96.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Lo0pLarp
 * @author Curv Protocol
 * @notice A Uniswap V4 lending hook that utilizes flash accounting for zero-slippage borrowing.
 * @dev Updated for secure Mainnet launch with Circuit Breaker and TWAP Oracle.
 */
contract Lo0pLarp is BaseHook, IUnlockCallback, Ownable {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant LTV_LIMIT = 40; // 40%
    uint256 public constant LIQUIDATION_THRESHOLD = 50; // 50%
    uint256 public constant LIQUIDATION_BONUS = 10; // 10% bonus for liquidators
    uint256 public constant MAX_LIQUIDATIONS_PER_BLOCK = 5;
    
    // --- State ---
    mapping(address => uint256) public collateral; // CURV deposited
    mapping(address => uint256) public debt;       // ETH borrowed
    
    IERC20 public immutable token; // CURV Token
    
    // --- Circuit Breaker State ---
    uint256 public lastLiquidationBlock;
    uint256 public liquidationsInCurrentBlock;

    // --- TWAP Oracle State ---
    struct Observation {
        uint32 blockTimestamp;
        int56 tickCumulative;
        bool initialized;
    }
    mapping(PoolId => Observation) public observations;

    // --- Events ---
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event LoanInitiated(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 debtRepaid, uint256 collateralTaken);

    enum Action { DEPOSIT, WITHDRAW, BORROW, REPAY, LIQUIDATE }

    struct CallbackData {
        Action action;
        PoolKey key;
        uint256 amount;
        address sender;
        address targetUser; // Used for liquidation
    }

    constructor(IPoolManager _poolManager, address _owner) 
        BaseHook(_poolManager) 
        Ownable(_owner) 
    {
        token = IERC20(0x0b5702A3000A3ae3e80C3dfD6Be547c4325f7EB9);
    }

    // --- Hook Configuration ---

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
    return Hooks.Permissions({
        beforeInitialize: false,
        afterInitialize: false,
        beforeAddLiquidity: false,
        afterAddLiquidity: false, // Changed to match address
        beforeRemoveLiquidity: true, // BIT 5 (matches C480)
        afterRemoveLiquidity: false,
        beforeSwap: false, // Changed to match address
        afterSwap: false,
        beforeDonate: true, // BIT 9 (matches C480)
        afterDonate: false,
        beforeSwapReturnDelta: false,
        afterSwapReturnDelta: false,
        afterAddLiquidityReturnDelta: false,
        afterRemoveLiquidityReturnDelta: false
    });
}

    // --- TWAP Observation Logic ---

    function _beforeRemoveLiquidity(
        address,
        PoolKey calldata key,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal override returns (bytes4) {
        PoolId id = key.toId();
        (, int24 tick, , ) = poolManager.getSlot0(id);
        _updateObservation(id, tick);
        return BaseHook.beforeRemoveLiquidity.selector;
    }

    function _beforeDonate(
        address,
        PoolKey calldata key,
        uint256,
        uint256,
        bytes calldata
    ) internal override returns (bytes4) {
        PoolId id = key.toId();
        (, int24 tick, , ) = poolManager.getSlot0(id);
        _updateObservation(id, tick);
        return BaseHook.beforeDonate.selector;
    }

    function _updateObservation(PoolId id, int24 tick) internal {
        Observation storage obs = observations[id];
        uint32 now32 = uint32(block.timestamp);
        if (!obs.initialized) {
            observations[id] = Observation(now32, 0, true);
        } else {
            uint32 delta = now32 - obs.blockTimestamp;
            if (delta > 0) {
                obs.tickCumulative += int56(tick) * int32(delta);
                obs.blockTimestamp = now32;
            }
        }
    }

    function getTWAPPrice(PoolKey memory key) public view returns (uint256 priceX96) {
        PoolId id = key.toId();
        Observation memory obs = observations[id];
        (, int24 currentTick, , ) = poolManager.getSlot0(id);
        
        uint32 timeDelta = uint32(block.timestamp) - obs.blockTimestamp;
        int24 avgTick;
        
        if (timeDelta == 0) {
            avgTick = currentTick; // Fallback to spot if same block
        } else {
            // Simple TWAP since last observation
            avgTick = int24((obs.tickCumulative + int56(currentTick) * int32(timeDelta)) / int32(uint32(block.timestamp) - obs.blockTimestamp));
            // Note: In a production environment with multiple observations, we'd use a window.
        }
        
        uint160 sqrtPriceX96 = TickMath.getSqrtPriceAtTick(avgTick);
        return FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, FixedPoint96.Q96);
    }

    // --- Circuit Breaker ---

    function _checkCircuitBreaker() internal {
        if (block.number > lastLiquidationBlock) {
            lastLiquidationBlock = block.number;
            liquidationsInCurrentBlock = 1;
        } else {
            require(liquidationsInCurrentBlock < MAX_LIQUIDATIONS_PER_BLOCK, "Circuit breaker: limit reached");
            liquidationsInCurrentBlock++;
        }
    }

    // --- External Interface ---

    function depositCollateral(PoolKey calldata key, uint256 amount) external {
        require(Currency.unwrap(key.currency1) == address(token), "Invalid pool for collateral");
        poolManager.unlock(abi.encode(CallbackData(Action.DEPOSIT, key, amount, msg.sender, address(0))));
    }

    function withdrawCollateral(PoolKey calldata key, uint256 amount) external {
        poolManager.unlock(abi.encode(CallbackData(Action.WITHDRAW, key, amount, msg.sender, address(0))));
    }

    function borrow(PoolKey calldata key, uint256 amount) external {
        uint256 priceX96 = getTWAPPrice(key);
        uint256 collateralValueInEth = FullMath.mulDiv(collateral[msg.sender], priceX96, FixedPoint96.Q96);
        
        require((debt[msg.sender] + amount) * 100 <= collateralValueInEth * LTV_LIMIT, "Over LTV limit");
        poolManager.unlock(abi.encode(CallbackData(Action.BORROW, key, amount, msg.sender, address(0))));
    }

    function repay(PoolKey calldata key, uint256 amount) external payable {
        poolManager.unlock(abi.encode(CallbackData(Action.REPAY, key, amount, msg.sender, address(0))));
    }

    function liquidate(PoolKey calldata key, address user, uint256 amountToRepay) external {
        _checkCircuitBreaker();
        
        uint256 priceX96 = getTWAPPrice(key);
        uint256 collateralValueInEth = FullMath.mulDiv(collateral[user], priceX96, FixedPoint96.Q96);
        
        require(debt[user] * 100 > collateralValueInEth * LIQUIDATION_THRESHOLD, "User is healthy");
        
        poolManager.unlock(abi.encode(CallbackData(Action.LIQUIDATE, key, amountToRepay, msg.sender, user)));
    }

    // --- Unlock Callback (Airtight Accounting) ---

    function unlockCallback(bytes calldata data) external override onlyPoolManager returns (bytes memory) {
        CallbackData memory cb = abi.decode(data, (CallbackData));

        if (cb.action == Action.DEPOSIT) {
            collateral[cb.sender] += cb.amount;
            // Settle CURV
            poolManager.sync(cb.key.currency1);
            token.safeTransferFrom(cb.sender, address(poolManager), cb.amount);
            poolManager.settle();
            emit CollateralDeposited(cb.sender, cb.amount);
        } 
        else if (cb.action == Action.WITHDRAW) {
            uint256 priceX96 = getTWAPPrice(cb.key);
            uint256 remainingCollateral = collateral[cb.sender] - cb.amount;
            uint256 collateralValueInEth = FullMath.mulDiv(remainingCollateral, priceX96, FixedPoint96.Q96);
            require(debt[cb.sender] * 100 <= collateralValueInEth * LTV_LIMIT, "Withdraw violates LTV");
            
            collateral[cb.sender] -= cb.amount;
            poolManager.take(cb.key.currency1, cb.sender, cb.amount);
            emit CollateralWithdrawn(cb.sender, cb.amount);
        }
        else if (cb.action == Action.BORROW) {
            debt[cb.sender] += cb.amount;
            poolManager.take(cb.key.currency0, cb.sender, cb.amount);
            emit LoanInitiated(cb.sender, cb.amount);
        }
        else if (cb.action == Action.REPAY) {
            uint256 repayAmount = cb.amount > debt[cb.sender] ? debt[cb.sender] : cb.amount;
            debt[cb.sender] -= repayAmount;
            
            poolManager.sync(cb.key.currency0);
            poolManager.settle{value: repayAmount}();
            emit LoanRepaid(cb.sender, repayAmount);
        }
        else if (cb.action == Action.LIQUIDATE) {
            uint256 repayAmount = cb.amount > debt[cb.targetUser] ? debt[cb.targetUser] : cb.amount;
            debt[cb.targetUser] -= repayAmount;
            
            // Calculate collateral to take: (debt * (1 + bonus)) / price
            uint256 priceX96 = getTWAPPrice(cb.key);
            uint256 collateralToTake = FullMath.mulDiv(repayAmount * (100 + LIQUIDATION_BONUS), FixedPoint96.Q96, priceX96 * 100);
            
            if (collateralToTake > collateral[cb.targetUser]) {
                collateralToTake = collateral[cb.targetUser];
            }
            
            collateral[cb.targetUser] -= collateralToTake;
            
            // Liquidator settles ETH
            poolManager.sync(cb.key.currency0);
            poolManager.settle{value: repayAmount}();
            
            // Liquidator takes CURV
            poolManager.take(cb.key.currency1, cb.sender, collateralToTake);
            
            emit Liquidated(cb.targetUser, cb.sender, repayAmount, collateralToTake);
        }

        return "";
    }

    // --- Admin Features ---

    function emergencyWithdraw(address _token, uint256 amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(_token).safeTransfer(owner(), amount);
        }
    }
}

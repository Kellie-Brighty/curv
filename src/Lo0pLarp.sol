// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/base/hooks/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Lo0pLarp
 * @author Curv Protocol
 * @notice A Uniswap V4 lending hook that utilizes flash accounting for zero-slippage borrowing.
 */
contract Lo0pLarp is BaseHook, IUnlockCallback, Ownable {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using SafeERC20 for IERC20;

    // --- State ---
    mapping(address => uint256) public collateral; // CURV deposited
    mapping(address => uint256) public debt;       // ETH borrowed
    
    uint256 public constant LTV_LIMIT = 40; // 40%
    IERC20 public immutable token; // CURV Token

    // --- Events ---
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event LoanInitiated(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);

    enum Action { DEPOSIT, WITHDRAW, BORROW, REPAY }

    struct CallbackData {
        Action action;
        PoolKey key;
        uint256 amount;
        address sender;
    }

    constructor(IPoolManager _poolManager, address _token) 
        BaseHook(_poolManager) 
        Ownable(msg.sender) 
    {
        token = IERC20(_token);
    }

    // --- Hook Configuration ---

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: true,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // --- External Interface ---

    function depositCollateral(PoolKey calldata key, uint256 amount) external {
        poolManager.unlock(abi.encode(CallbackData(Action.DEPOSIT, key, amount, msg.sender)));
    }

    function withdrawCollateral(PoolKey calldata key, uint256 amount) external {
        poolManager.unlock(abi.encode(CallbackData(Action.WITHDRAW, key, amount, msg.sender)));
    }

    function borrow(PoolKey calldata key, uint256 amount) external {
        require((debt[msg.sender] + amount) * 100 <= collateral[msg.sender] * LTV_LIMIT, "Over LTV limit");
        poolManager.unlock(abi.encode(CallbackData(Action.BORROW, key, amount, msg.sender)));
    }

    function repay(PoolKey calldata key, uint256 amount) external payable {
        poolManager.unlock(abi.encode(CallbackData(Action.REPAY, key, amount, msg.sender)));
    }

    // --- Unlock Callback (Flash Accounting) ---

    function unlockCallback(bytes calldata data) external override onlyPoolManager returns (bytes memory) {
        CallbackData memory cb = abi.decode(data, (CallbackData));

        if (cb.action == Action.DEPOSIT) {
            collateral[cb.sender] += cb.amount;
            cb.key.currency1.sync();
            token.safeTransferFrom(cb.sender, address(poolManager), cb.amount);
            cb.key.currency1.settle();
            emit CollateralDeposited(cb.sender, cb.amount);
        } 
        else if (cb.action == Action.WITHDRAW) {
            require(collateral[cb.sender] >= cb.amount, "Insufficient collateral");
            collateral[cb.sender] -= cb.amount;
            cb.key.currency1.take(cb.sender, cb.amount);
            emit CollateralWithdrawn(cb.sender, cb.amount);
        }
        else if (cb.action == Action.BORROW) {
            debt[cb.sender] += cb.amount;
            cb.key.currency0.take(cb.sender, cb.amount);
            emit LoanInitiated(cb.sender, cb.amount);
        }
        else if (cb.action == Action.REPAY) {
            require(debt[cb.sender] >= cb.amount, "Repaying more than debt");
            debt[cb.sender] -= cb.amount;
            cb.key.currency0.settle{value: cb.amount}();
            emit LoanRepaid(cb.sender, cb.amount);
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

    // --- Internal Overrides ---

    function _beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) internal override returns (bytes4, BalanceDelta) {
        return (BaseHook.afterAddLiquidity.selector, BalanceDeltaLibrary.ZERO_DELTA);
    }
}

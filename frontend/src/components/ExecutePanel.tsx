import React, { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { mainnet } from 'viem/chains';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKEN_ADDRESS, HOOK_ADDRESS } from '../constants/contracts';

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: 'balance', type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: 'remaining', type: 'uint256' }] }
];

const HOOK_ABI = [
  { name: 'collateral', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'amount', type: 'uint256' }] },
  { name: 'debt', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'amount', type: 'uint256' }] }
];

const ExecutePanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'BORROW' | 'REPAY'>('BORROW');
  const [depositValue, setDepositValue] = useState('');
  const [borrowValue, setBorrowValue] = useState('');
  const [repayValue, setRepayValue] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: tokenBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: mainnet.id
  });

  const { data: userCollateral } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOK_ABI,
    functionName: 'collateral',
    args: address ? [address] : undefined,
    chainId: mainnet.id
  });

  const { data: userDebt } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOK_ABI,
    functionName: 'debt',
    args: address ? [address] : undefined,
    chainId: mainnet.id
  });

  const ltvLimit = 0.40;
  const numCollateral = userCollateral ? parseFloat(formatEther(userCollateral as bigint)) : 0;
  const numDebt = userDebt ? parseFloat(formatEther(userDebt as bigint)) : 0;
  
  const numBorrow = parseFloat(borrowValue) || 0;
  const maxBorrow = Math.max(0, (numCollateral * ltvLimit) - numDebt);
  const isOverLtv = numBorrow > maxBorrow;

  const handleAction = () => {
    setShowCountdown(true);
  };

  return (
    <div className="h-full bg-black border-l border-[#1A1A1A] p-8 flex flex-col font-mono overflow-y-auto no-scrollbar relative">
      {!isConnected && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-full border border-[#00ff88]/20 flex items-center justify-center bg-[#00ff88]/5 animate-pulse">
            <span className="text-[#00ff88] text-xl">⚡</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.4em]">Protocol Locked</h3>
            <p className="text-[#666666] text-[10px] leading-relaxed uppercase tracking-widest">Connect your wallet to access the<br/>Curv lending engine</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-[#0A0A0A] border border-[#1A1A1A] p-1 mb-8">
        <button 
          onClick={() => setActiveTab('BORROW')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'BORROW' ? 'bg-white text-black' : 'text-[#666666] hover:text-white'}`}
        >
          Borrow
        </button>
        <button 
          onClick={() => setActiveTab('REPAY')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'REPAY' ? 'bg-white text-black' : 'text-[#666666] hover:text-white'}`}
        >
          Repay
        </button>
      </div>

      <div className="flex-1 space-y-12">
        {activeTab === 'BORROW' ? (
          <>
            {/* Step 1: Deposit */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border border-[#00ff88] text-[#00ff88] flex items-center justify-center text-[8px] font-bold">1</span>
                <label className="text-[9px] text-[#999999] uppercase tracking-[0.3em] font-bold">Deposit CURV Collateral</label>
              </div>
              
              <div className="flex justify-between px-1 mb-1">
                <span className="text-[8px] text-[#666666] uppercase tracking-widest">In Wallet</span>
                <span className="text-[8px] text-[#00ff88] tabular-nums font-bold">
                  {tokenBalance ? Number(formatEther(tokenBalance as bigint)).toFixed(4) : '0.0000'} CURV
                </span>
              </div>

              <div className="relative">
                <input 
                  type="text"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-[#1A1A1A] p-5 text-xl font-medium focus:outline-none focus:border-[#00ff88] transition-colors placeholder-[#333333]"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <span className="text-[9px] text-[#999999] font-bold tracking-widest">CURV</span>
                </div>
              </div>
              <button 
                disabled={!depositValue}
                onClick={handleAction}
                className="w-full py-4 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
              >
                Deposit Collateral
              </button>
            </div>

            {/* Step 2: Borrow */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border border-[#00ff88] text-[#00ff88] flex items-center justify-center text-[8px] font-bold">2</span>
                <label className="text-[9px] text-[#999999] uppercase tracking-[0.3em] font-bold">ETH to Borrow</label>
              </div>

              <div className="relative">
                <input 
                  type="text"
                  value={borrowValue}
                  onChange={(e) => setBorrowValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-[#1A1A1A] p-5 text-xl font-medium focus:outline-none focus:border-[#00ff88] transition-colors placeholder-[#333333]"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <span className="text-[9px] text-[#666666] font-bold tracking-widest uppercase">ETH</span>
                </div>
              </div>

              <div className="flex justify-between px-1 text-[8px] uppercase tracking-widest">
                <span className="text-[#666666]">Max Borrowable:</span>
                <span className="text-[#00ff88] font-bold">{maxBorrow.toFixed(6)} ETH</span>
              </div>

              <button 
                disabled={!borrowValue || isOverLtv}
                onClick={handleAction}
                className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${isOverLtv ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#00ff88] text-black hover:bg-white'}`}
              >
                {isOverLtv ? 'LTV Limit Exceeded' : 'Initiate Borrow'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[9px] text-[#999999] uppercase tracking-[0.3em] font-bold">Amount to Repay</label>
              <div className="relative">
                <input 
                  type="text"
                  value={repayValue}
                  onChange={(e) => setRepayValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-[#1A1A1A] p-5 text-xl font-medium focus:outline-none focus:border-[#00ff88] transition-colors placeholder-[#333333]"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <span className="text-[9px] text-[#666666] font-bold tracking-widest uppercase">ETH</span>
                </div>
              </div>
              <button 
                disabled={!repayValue}
                onClick={handleAction}
                className="w-full py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#00ff88] transition-all"
              >
                Repay Debt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-auto pt-8 border-t border-[#1A1A1A] space-y-4">
        <div className="flex justify-between items-center text-[8px] uppercase tracking-widest">
          <span className="text-[#666666]">Locked Collateral</span>
          <span className="text-white font-bold">{numCollateral.toFixed(4)} CURV</span>
        </div>
        <div className="flex justify-between items-center text-[8px] uppercase tracking-widest">
          <span className="text-[#666666]">Total Debt</span>
          <span className="text-white font-bold">{numDebt.toFixed(4)} ETH</span>
        </div>
        <div className="h-1 bg-[#111111] w-full overflow-hidden">
          <motion.div 
            className={`h-full ${numDebt / (numCollateral * ltvLimit) > 0.8 ? 'bg-red-500' : 'bg-[#00ff88]'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (numDebt / (numCollateral * ltvLimit)) * 100) || 0}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[8px] uppercase tracking-widest">
          <span className="text-[#666666]">LTV Usage</span>
          <span className={numDebt / (numCollateral * ltvLimit) > 0.8 ? 'text-red-500 font-bold' : 'text-white'}>
            {((numDebt / (numCollateral * ltvLimit)) * 100 || 0).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Countdown Modal */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowCountdown(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-md bg-[#050505] border border-[#1A1A1A] p-12 text-center space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-[#00ff88] text-[10px] font-black uppercase tracking-[0.5em]">System Sync</h2>
                <p className="text-[#666666] text-[8px] uppercase tracking-widest">Mainnet Soft Launch Phase</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'HRS', value: timeLeft.hours },
                  { label: 'MIN', value: timeLeft.minutes },
                  { label: 'SEC', value: timeLeft.seconds }
                ].map((unit) => (
                  <div key={unit.label} className="bg-black border border-[#1A1A1A] p-4">
                    <div className="text-2xl font-black text-white tabular-nums">{String(unit.value).padStart(2, '0')}</div>
                    <div className="text-[7px] text-[#444] font-bold tracking-tighter">{unit.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-[#999999] leading-relaxed uppercase tracking-widest">
                Protocol functions are synchronizing with the official Uniswap V4 Pool. <br/>
                Trading remains active via the Hook.
              </p>

              <button 
                onClick={() => setShowCountdown(false)}
                className="w-full py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#00ff88] transition-all"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutePanel;

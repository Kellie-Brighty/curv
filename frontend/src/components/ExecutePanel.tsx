import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useBalance
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import { TOKEN_ADDRESS, HOOK_ADDRESS, SEPOLIA_POOL_KEY } from '../constants/contracts';

import Lo0pLarp_ABI from '../abi/Lo0pLarp.json';

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }
] as const;

const ExecutePanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('BORROW');

  // Inputs
  const [depositValue, setDepositValue] = useState('');
  const [borrowValue, setBorrowValue] = useState('');
  const [repayValue, setRepayValue] = useState('');

  // 1. Live Data Fetching
  const { refetch: refetchEth } = useBalance({ address });
  const { refetch: refetchToken } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: sepolia.id
  });

  const { data: userCollateral, refetch: refetchCollateral } = useReadContract({
    address: HOOK_ADDRESS,
    abi: Lo0pLarp_ABI as any,
    functionName: 'collateral',
    args: address ? [address] : undefined,
    chainId: sepolia.id
  });

  const { data: userDebt, refetch: refetchDebt } = useReadContract({
    address: HOOK_ADDRESS,
    abi: Lo0pLarp_ABI as any,
    functionName: 'debt',
    args: address ? [address] : undefined,
    chainId: sepolia.id
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, HOOK_ADDRESS] : undefined,
    chainId: sepolia.id
  });

  // 2. Contract Writes
  const { writeContract: writeApprove, data: approveHash, error: approveError } = useWriteContract();
  const { writeContract: writeExecute, data: executeHash, error: executeError } = useWriteContract();

  const { isLoading: isApprovePending, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isExecutePending, isSuccess: isExecuteSuccess } = useWaitForTransactionReceipt({ hash: executeHash });

  // 2b. Error Handling
  useEffect(() => {
    if (approveError) {
      toast.error(`Approval failed: ${approveError.message.slice(0, 50)}...`);
    }
    if (executeError) {
      toast.error(`Execution failed: ${executeError.message.slice(0, 50)}...`);
    }
  }, [approveError, executeError]);

  // 3. Auto-Refresh Logic
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('CURV Approval Confirmed');
      refetchAllowance();
    }
  }, [isApproveSuccess]);

  useEffect(() => {
    if (isExecuteSuccess) {
      toast.success('Transaction Successful');
      setDepositValue('');
      setBorrowValue('');
      setRepayValue('');
      refetchCollateral();
      refetchEth();
      refetchToken();
      refetchDebt();
    }
  }, [isExecuteSuccess]);

  // 4. Logic & Validation
  const ltvLimit = 0.40;
  const numCollateral = userCollateral ? parseFloat(formatEther(userCollateral as bigint)) : 0;
  const numDebt = userDebt ? parseFloat(formatEther(userDebt as bigint)) : 0;
  
  const numBorrow = parseFloat(borrowValue) || 0;
  const maxBorrow = Math.max(0, (numCollateral * ltvLimit) - numDebt);
  const isOverLtv = numBorrow > maxBorrow;

  const needsApproval = allowance !== undefined && 
                       parseEther(depositValue || '0') > (allowance as bigint);

  const handleDeposit = () => {
    if (needsApproval) {
      writeApprove({
        address: TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [HOOK_ADDRESS, parseEther('1000000')],
        account: address!,
        chain: sepolia
      });
    } else {
      writeExecute({
        address: HOOK_ADDRESS,
        abi: Lo0pLarp_ABI as any,
        functionName: 'depositCollateral',
        args: [SEPOLIA_POOL_KEY, parseEther(depositValue)],
        account: address!,
        chain: sepolia
      });
    }
  };

  const handleBorrow = () => {
    writeExecute({
      address: HOOK_ADDRESS,
      abi: Lo0pLarp_ABI as any,
      functionName: 'borrow',
      args: [SEPOLIA_POOL_KEY, parseEther(borrowValue)],
      account: address!,
      chain: sepolia
    });
  };

  const handleRepay = () => {
    writeExecute({
      address: HOOK_ADDRESS,
      abi: Lo0pLarp_ABI as any,
      functionName: 'repay',
      args: [SEPOLIA_POOL_KEY, parseEther(repayValue)],
      account: address!,
      chain: sepolia,
      value: parseEther(repayValue)
    });
  };

  const handleMint = () => {
    writeExecute({
      address: TOKEN_ADDRESS,
      abi: [
        { name: 'mint', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] }
      ],
      functionName: 'mint',
      args: [address!, parseEther('1000')],
      account: address!,
      chain: sepolia
    });
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
          <div className="w-12 h-[1px] bg-[#1A1A1A]"></div>
        </div>
      )}

      <div className="flex border border-[#1A1A1A] mb-8 shrink-0">
        {['BORROW', 'REPAY'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-bold tracking-[0.2em] transition-all ${
              activeTab === tab ? 'bg-white text-black' : 'text-[#999999] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-10">
        {activeTab === 'BORROW' ? (
          <>
            {/* Step 1: Deposit Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border border-[#00ff88] text-[#00ff88] flex items-center justify-center text-[8px] font-bold">1</span>
                <label className="text-[9px] text-[#999999] uppercase tracking-[0.3em] font-bold">Deposit CURV Collateral</label>
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
                  <button 
                    onClick={handleMint}
                    className="text-[8px] text-[#00ff88] border border-[#00ff88]/30 px-2 py-1 hover:bg-[#00ff88]/10 transition-all uppercase font-bold"
                  >
                    Faucet
                  </button>
                  <span className="text-[9px] text-[#999999] font-bold tracking-widest">CURV</span>
                </div>
              </div>
              <button 
                disabled={!depositValue || isExecutePending || isApprovePending}
                onClick={handleDeposit}
                className="w-full py-4 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
              >
                {isApprovePending ? 'Approving...' : needsApproval ? 'Approve CURV' : 'Deposit Collateral'}
              </button>
            </div>

            {/* Step 2: Borrow Section */}
            <div className={`space-y-6 transition-opacity ${numCollateral === 0 ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border border-[#00ff88] text-[#00ff88] flex items-center justify-center text-[8px] font-bold shadow-[0_0_10px_rgba(0,255,136,0.2)]">2</span>
                <label className="text-[9px] text-white uppercase tracking-[0.3em] font-bold">ETH to Borrow</label>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  value={borrowValue}
                  onChange={(e) => setBorrowValue(e.target.value)}
                  placeholder="0.00"
                  className={`w-full bg-[#050505] border ${isOverLtv ? 'border-red-500' : 'border-[#1A1A1A]'} p-5 text-xl font-medium focus:outline-none focus:border-[#00ff88] transition-colors placeholder-[#333333]`}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-[#999999] font-bold tracking-widest">ETH</span>
              </div>
              <div className="flex justify-between text-[9px] tracking-widest px-1">
                <span className="text-[#999999]">Max Borrowable:</span>
                <span className="text-[#00ff88]">{maxBorrow.toFixed(6)} ETH</span>
              </div>
              <button 
                disabled={!borrowValue || isOverLtv || isExecutePending}
                onClick={handleBorrow}
                className={`w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] transition-all ${
                  isOverLtv ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#00ff88] text-black hover:bg-[#00e67a]'
                }`}
              >
                {isOverLtv ? 'LTV Limit Exceeded' : isExecutePending ? 'Processing...' : 'Initiate Borrow'}
              </button>
            </div>
          </>
        ) : (
          /* Repay Section */
          <div className="space-y-6">
            <label className="text-[9px] text-[#999999] uppercase tracking-[0.3em] font-bold">Repay ETH Loan</label>
            <div className="relative">
              <input 
                type="text"
                value={repayValue}
                onChange={(e) => setRepayValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#050505] border border-[#1A1A1A] p-5 text-xl font-medium focus:outline-none focus:border-[#00ff88] transition-colors placeholder-[#333333]"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-[#999999] font-bold tracking-widest">ETH</span>
            </div>
            <button 
              disabled={!repayValue || isExecutePending}
              onClick={handleRepay}
              className="w-full py-5 bg-[#00ff88] text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#00e67a]"
            >
              Confirm Repayment
            </button>
          </div>
        )}

        {/* Global Protocol Context */}
        <div className="pt-8 border-t border-[#1A1A1A] space-y-4">
          <div className="flex justify-between text-[9px] tracking-widest text-[#999999] uppercase font-bold">
            <span>Locked Collateral</span>
            <span className="text-white">{numCollateral.toFixed(4)} CURV</span>
          </div>
          <div className="flex justify-between text-[9px] tracking-widest text-[#999999] uppercase font-bold">
            <span>Total Debt</span>
            <span className="text-red-400">{numDebt.toFixed(4)} ETH</span>
          </div>
          <div className="h-1 bg-[#1A1A1A] w-full rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (numDebt / (numCollateral * ltvLimit + 0.000001)) * 100)}%` }}
              className={`h-full ${isOverLtv ? 'bg-red-500' : 'bg-[#00ff88]'}`}
            />
          </div>
          <div className="flex justify-between text-[8px] tracking-widest text-[#666666] uppercase">
            <span>LTV Usage</span>
            <span>{((numDebt / (numCollateral * ltvLimit + 0.000001)) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutePanel;

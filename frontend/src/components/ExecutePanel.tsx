import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useWatchContractEvent
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

// Constants (Placeholders - Using valid 0x addresses for TS safety)
const CURV_HOOK_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const COLLATERAL_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001' as const;

// Mock ABIs
const ERC20_ABI = [
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }
] as const;

const CURV_HOOK_ABI = [
  { name: 'mint', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'burn', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'borrow', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] }
] as const;

const ExecutePanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('BORROW');
  const [inputValue, setInputValue] = useState('');
  const tabs = ['MINT', 'BURN', 'BORROW'];

  // 1. Check Balance and Allowance
  const { data: balance } = useReadContract({
    address: COLLATERAL_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: COLLATERAL_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CURV_HOOK_ADDRESS] : undefined,
    query: { enabled: !!address }
  });

  // 2. Write Contract (Approve and Execute)
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeExecute, data: executeHash } = useWriteContract();

  // 3. Transaction Status
  const { isLoading: isApprovePending, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isExecutePending, isSuccess: isExecuteSuccess } = useWaitForTransactionReceipt({ hash: executeHash });

  // 4. Validation
  const ltvLimit = 0.40;
  const numericInput = parseFloat(inputValue) || 0;
  const numericBalance = balance ? parseFloat(formatEther(balance)) : 0;
  const isOverLtv = activeTab === 'BORROW' && numericInput > numericBalance * ltvLimit;
  const needsApproval = allowance !== undefined && balance !== undefined && allowance < (balance || 0n);

  // 5. Handlers
  const handleAction = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (needsApproval && (activeTab === 'BURN' || activeTab === 'BORROW')) {
      toast.loading('Confirming Approval in Wallet...', { id: 'approve' });
      writeApprove({
        address: COLLATERAL_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CURV_HOOK_ADDRESS, parseEther(inputValue || '0')],
        account: address!,
        chain: mainnet
      });
      return;
    }

    toast.loading('Confirming in Wallet...', { id: 'execute' });
    // This would call your actual hook function
    writeExecute({
      address: CURV_HOOK_ADDRESS,
      abi: CURV_HOOK_ABI,
      functionName: activeTab.toLowerCase() as 'mint' | 'burn' | 'borrow',
      args: [parseEther(inputValue || '0')],
      account: address!,
      chain: mainnet
    });
  };

  // 6. Notifications Logic
  useEffect(() => {
    if (isApprovePending) toast.loading('Approval Pending...', { id: 'approve' });
    if (isApproveSuccess) {
      toast.success('Approval Successful', { id: 'approve' });
      refetchAllowance();
    }
  }, [isApprovePending, isApproveSuccess]);

  useEffect(() => {
    if (isExecutePending) toast.loading('Transaction Pending...', { id: 'execute' });
    if (isExecuteSuccess) toast.success('Transaction Success!', { id: 'execute' });
  }, [isExecutePending, isExecuteSuccess]);

  // 7. Watch Events
  useWatchContractEvent({
    address: CURV_HOOK_ADDRESS,
    abi: [], // Add your hook ABI with Borrow/Mint events
    eventName: 'Borrow',
    onLogs() {
      toast('New Borrow Event Detected!', { icon: '📊' });
      // Trigger refresh of chart/stats (via parent or global state)
    },
  });

  return (
    <div className="flex flex-col bg-[#050505] border border-[#1A1A1A] h-full font-mono">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#050505', color: '#fff', border: '1px solid #1A1A1A', fontSize: '10px' } }} />
      
      {/* Panel Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#1A1A1A]">
        <span className="text-[10px] tracking-[0.2em] text-[#00ff88] font-bold uppercase flex items-center gap-2">
          ● EXECUTE PANEL
        </span>
        <span className="text-[9px] text-[#999999] uppercase font-bold tracking-widest">
          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-[#1A1A1A]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-5 text-[10px] font-bold tracking-[0.2em] uppercase border-r border-[#1A1A1A] last:border-r-0 transition-colors ${
              activeTab === tab ? 'bg-[#1A1A1A] text-[#00ff88]' : 'text-[#999999] hover:text-white'
            }`}
          >
            {tab}
            {tab === 'BORROW' && (
              <span className="absolute top-1 right-1 text-[6px] px-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 rounded-[2px] animate-pulse">
                LDF NATIVE
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="p-8 space-y-8 flex-1">
        {/* Input Field */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#999999] font-bold uppercase tracking-[0.2em]">Input Amount</span>
            <span className="text-[9px] text-[#999999] tracking-widest uppercase">
              Bal: <span className="text-white font-medium">{numericBalance.toFixed(2)}</span>
            </span>
          </div>
          <div className={`bg-black border p-6 flex justify-between items-center transition-all group ${isOverLtv ? 'border-red-500/50' : 'border-[#1A1A1A] hover:border-white/20'}`}>
            <input 
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-3xl font-medium text-white tracking-tighter outline-none w-full placeholder:text-white/10"
            />
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setInputValue(numericBalance.toString())}
                className="text-[9px] border border-[#1A1A1A] px-2.5 py-1 text-[#999999] hover:text-white hover:border-white/30 transition-all uppercase font-bold"
              >
                Max
              </button>
              <span className="text-sm font-bold tracking-[0.1em] text-white">ETH</span>
            </div>
          </div>
          {isOverLtv && (
            <div className="text-[9px] text-red-500 font-bold uppercase tracking-widest animate-pulse">
              ⚠️ Insufficient Collateral Balance (40% LTV Limit)
            </div>
          )}
          {!isOverLtv && (
            <div className="text-[9px] tracking-widest text-[#999999] uppercase">≈ ${(numericInput * 2500).toFixed(2)} USD</div>
          )}
        </div>

        {/* Action Button */}
        <button 
          disabled={isOverLtv || !isConnected}
          onClick={handleAction}
          className={`w-full py-5 font-bold uppercase tracking-[0.3em] text-[10px] transition-all mt-4 shadow-[0_0_20px_rgba(0,255,136,0.15)] active:scale-[0.98] ${
            isOverLtv || !isConnected 
            ? 'bg-[#1A1A1A] text-white/20 cursor-not-allowed' 
            : 'bg-[#00ff88] text-black hover:bg-[#00ff88]/90'
          }`}
        >
          {needsApproval && (activeTab === 'BURN' || activeTab === 'BORROW') 
            ? 'APPROVE CURV →' 
            : `INITIATE ${activeTab} →`
          }
        </button>

        {/* Detailed Stats */}
        <div className="pt-8 space-y-4 border-t border-[#1A1A1A]">
          {[
            { label: 'Current APR', value: '2.4%', live: true },
            { label: 'Liquidation Price', value: '0.0012 ETH', live: false },
            { label: 'LTV Ratio', value: isOverLtv ? 'EXCEEDED' : '40% MAX', live: isOverLtv },
          ].map((item, i) => (
            <div key={i} className="flex justify-between text-[10px] tracking-widest uppercase font-medium">
              <span className="text-[#999999]">{item.label}</span>
              <span className={item.live ? 'text-[#00ff88]' : 'text-white'}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutePanel;

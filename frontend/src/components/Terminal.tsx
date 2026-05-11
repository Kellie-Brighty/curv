import React, { useState } from 'react';
import { useWatchContractEvent, useAccount, useBalance, useReadContract, useConnect, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import { motion, AnimatePresence } from 'framer-motion';
import LDFSkyline from './LDFSkyline';
import ExecutePanel from './ExecutePanel';
import Manifesto from './Manifesto';
import { HOOK_ADDRESS, TOKEN_ADDRESS } from '../constants/contracts';

import MockCURV_ABI from '../abi/MockCURV.json';
import Lo0pLarp_ABI from '../abi/Lo0pLarp.json';

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }
] as const;

const Terminal: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Live Data Fetching
  const { data: ethBalance, refetch: refetchEth } = useBalance({ address });
  
  const { data: tokenBalance, refetch: refetchToken } = useReadContract({
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

  // Fetch Hook's CURV balance (Collateral Reserve)
  const { data: hookReserve, refetch: refetchReserve } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: MockCURV_ABI as any,
    functionName: 'balanceOf',
    args: [HOOK_ADDRESS],
    chainId: sepolia.id
  });

  // 2. Real-time Hook Syncing
  useWatchContractEvent({
    address: HOOK_ADDRESS,
    abi: Lo0pLarp_ABI as any,
    eventName: 'Deposit' as any,
    onLogs() {
      setRefreshKey(prev => prev + 1);
      refetchEth();
      refetchCollateral();
      refetchReserve();
    },
  });

  useWatchContractEvent({
    address: HOOK_ADDRESS,
    abi: Lo0pLarp_ABI as any,
    eventName: 'Borrow' as any,
    onLogs() {
      setRefreshKey(prev => prev + 1);
      refetchToken();
      refetchReserve();
    },
  });

  const tickerStats = [
    { label: 'User CURV', value: isConnected ? `${tokenBalance ? formatEther(tokenBalance as bigint).slice(0, 8) : '0.00'} CURV` : '0.00 CURV', live: true },
    { label: 'User ETH', value: isConnected ? `${ethBalance ? formatEther(ethBalance.value).slice(0, 6) : '0.00'} ETH` : '0.00 ETH', live: true },
    { label: 'Collateral Locked', value: isConnected ? `${userCollateral ? formatEther(userCollateral as bigint).slice(0, 8) : '0.00'} CURV` : '0.00 CURV', live: true },
    { label: 'Pool CURV', value: `${hookReserve ? formatEther(hookReserve as bigint).slice(0, 10) : '...'} CURV`, live: true },
    { label: 'Network', value: 'Sepolia', color: '#00ff88' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-[#00ff88] selection:text-black overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="flex justify-between items-center px-8 py-6 w-full bg-black border-b border-[#1A1A1A] z-50">
        <div className="flex items-center gap-12">
          <div className="text-white text-3xl font-serif lowercase tracking-widest hover:text-[#00ff88] transition-colors cursor-pointer">
            curv
          </div>
          <div className="hidden lg:flex gap-8 text-[10px] tracking-[0.4em] text-[#999999] uppercase font-bold">
            <a href="#" className="hover:text-white transition-colors">Trade</a>
            <a href="#" className="hover:text-white transition-colors">Curve</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[9px] text-[#999999] tracking-[0.2em] uppercase font-bold hidden sm:block">
            Status: <span className="text-[#00ff88]">Online</span>
          </span>
          <button 
            onClick={() => isConnected ? disconnect() : setIsConnectModalOpen(true)}
            className="text-[10px] tracking-[0.2em] border border-white text-white px-6 py-2 font-bold uppercase hover:bg-white hover:text-black transition-all"
          >
            {isConnected ? `${address?.slice(0,6)}...${address?.slice(-4)} (X)` : 'Connect Wallet →'}
          </button>
        </div>
      </nav>

      {/* Real-time Ticker Bar */}
      <div className="flex bg-black border-b border-[#1A1A1A] px-8 py-3 overflow-x-auto no-scrollbar whitespace-nowrap">
        {tickerStats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 mr-12 text-[10px] tracking-widest uppercase font-medium">
            <span className="text-[#999999]">{stat.label}:</span>
            <span className={`font-bold ${stat.live ? 'text-[#00ff88]' : 'text-white'}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-12 min-h-[600px]">
          <div className="col-span-12 lg:col-span-8 border-r border-[#1A1A1A] flex flex-col p-12 space-y-10">
            <div className="relative z-20 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-[1px] w-8 bg-[#00ff88]"></div>
                 <span className="text-[9px] tracking-[0.4em] text-[#00ff88] uppercase font-bold">Protocol Dashboard v0.1</span>
              </div>
              <h1 className="leading-none">
                <span className="font-serif italic font-light text-7xl text-white">Liquidity</span><br />
                <span className="font-sans font-black text-6xl uppercase tracking-tighter text-[#00ff88] drop-shadow-[0_0_20px_rgba(0,255,136,0.4)]">
                  that does work.
                </span>
              </h1>
            </div>

            <div className="flex-1 border border-[#1A1A1A] bg-[#050505]/50 backdrop-blur-sm relative min-h-[400px]">
              <LDFSkyline 
                refreshKey={refreshKey}
              />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 h-full">
             <ExecutePanel />
          </div>
        </div>
        <Manifesto />
      </div>

      <footer className="p-8 border-t border-[#1A1A1A] flex justify-between items-center bg-[#050505]">
        <span className="text-[10px] text-[#999999] uppercase tracking-widest">© 2026 CURV PROTOCOL</span>
        <div className="flex gap-8 text-[10px] text-[#999999] uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">Github</a>
          <a href="#" className="hover:text-white transition-colors">Audit</a>
        </div>
      </footer>

      {/* Wallet Connect Modal */}
      <AnimatePresence>
        {isConnectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConnectModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#050505] border border-white/10 p-10 space-y-8 shadow-[0_0_50px_rgba(0,255,136,0.1)]"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-serif italic">Connect Wallet</h2>
                <p className="text-[10px] text-[#999999] uppercase tracking-[0.2em]">Select your preferred interface</p>
              </div>

              <div className="grid gap-4">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => {
                      connect({ connector });
                      setIsConnectModalOpen(false);
                    }}
                    className="group flex items-center justify-between p-6 border border-[#1A1A1A] hover:border-[#00ff88] hover:bg-[#00ff88]/5 transition-all text-left"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{connector.name}</span>
                    <div className="h-2 w-2 rounded-full bg-[#333333] group-hover:bg-[#00ff88] transition-colors" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setIsConnectModalOpen(false)}
                className="w-full text-[9px] text-[#666666] uppercase tracking-[0.4em] hover:text-white transition-colors"
              >
                Close Window
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Terminal;

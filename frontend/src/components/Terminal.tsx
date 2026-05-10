import React, { useState } from 'react';
import { useWatchContractEvent } from 'wagmi';
import LDFSkyline from './LDFSkyline';
import ExecutePanel from './ExecutePanel';
import Manifesto from './Manifesto';

const CURV_HOOK_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

const Terminal: React.FC = () => {
  const [hoverData, setHoverData] = useState({ reserve: '1,240.50', price: '0.001757' });
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time Hook Syncing: Watch for events and update chart
  useWatchContractEvent({
    address: CURV_HOOK_ADDRESS,
    abi: [
      { name: 'Borrow', type: 'event', inputs: [{ indexed: true, name: 'user', type: 'address' }, { name: 'amount', type: 'uint256' }] },
      { name: 'Mint', type: 'event', inputs: [{ indexed: true, name: 'user', type: 'address' }, { name: 'amount', type: 'uint256' }] }
    ] as const,
    onLogs() {
      setRefreshKey(prev => prev + 1);
    },
  });

  const tickerStats = [
    { label: 'Pool Total', value: `${hoverData.reserve} ETH`, live: true },
    { label: 'Spot Price', value: `${hoverData.price} ETH`, live: true },
    { label: 'Active Bands', value: '84/100', live: true },
    { label: 'Avg LTV', value: '40%', live: true },
    { label: 'Network', value: 'Mainnet', color: '#00ff88' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono selection:bg-[#00ff88] selection:text-black">
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
          <button className="text-[10px] tracking-[0.2em] border border-white text-white px-6 py-2 font-bold uppercase hover:bg-white hover:text-black transition-all">
            Connect Wallet →
          </button>
        </div>
      </nav>

      {/* Real-time Ticker Bar */}
      <div className="flex bg-black border-b border-[#1A1A1A] px-8 py-3 overflow-x-auto no-scrollbar whitespace-nowrap">
        {tickerStats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3 mr-12 text-[10px] tracking-widest uppercase font-medium">
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
                onUpdate={(reserve, price) => setHoverData({ reserve, price })} 
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
    </div>
  );
};

export default Terminal;

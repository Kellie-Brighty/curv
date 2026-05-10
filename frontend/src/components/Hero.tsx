import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-mono selection:bg-[#00ff88] selection:text-black">
      {/* Navigation Header */}
      <nav className="flex justify-between items-center px-8 py-6 w-full fixed top-0 bg-[#050505]/80 backdrop-blur-xl z-50 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-8">
          <div className="text-[#00ff88] text-xl font-bold tracking-tighter lowercase">
            target<span className="text-white"> hunter</span>
          </div>
          <div className="hidden md:flex gap-6 text-[10px] tracking-[0.3em] text-white/50 uppercase">
            <a href="#" className="hover:text-[#00ff88] transition-colors">Trade</a>
            <a href="#" className="hover:text-[#00ff88] transition-colors">Curve</a>
            <a href="#" className="hover:text-[#00ff88] transition-colors">Yellow Paper</a>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-[10px] tracking-[0.2em] bg-[#00ff88] text-black px-4 py-2 font-bold uppercase hover:bg-[#00ff88]/90 transition-all">
            Connect Wallet →
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col justify-center px-8 pt-32 pb-20 max-w-screen-xl mx-auto w-full">
        {/* Main Headline */}
        <div className="mb-16 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[1px] w-12 bg-[#00ff88]"></div>
            <span className="text-[10px] tracking-[0.4em] text-[#00ff88] uppercase">Uniswap V4 Hook</span>
          </div>
          <h1 className="leading-[1.1] mb-8">
            <span className="font-serif italic font-light text-8xl md:text-9xl block mb-2 opacity-90">
              Target
            </span>
            <span className="font-sans font-black text-7xl md:text-8xl uppercase tracking-tighter text-[#00ff88] drop-shadow-[0_0_20px_rgba(0,255,136,0.4)]">
              Hunter.
            </span>
          </h1>
          <p className="text-white/40 max-w-xl text-sm leading-relaxed font-sans mb-10">
            LDF is a Uniswap V4 hook lending AMM. Idle liquidity is lent out against 
            collateralized positions, preserving the spot price while maximizing 
            capital efficiency for everyone.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-l border-[#1a1a1a] mb-12">
          {[
            { label: 'Pool ETH', value: '167.43', unit: 'ETH' },
            { label: 'Spot Price', value: '0.001757', unit: 'ETH' },
            { label: 'Active Bands', value: '84 / 100', unit: 'LIVE' },
            { label: 'Avg LTV', value: '62.4', unit: '%' },
          ].map((stat, i) => (
            <div key={i} className="p-6 border-r border-b border-[#1a1a1a] flex flex-col gap-2 hover:bg-white/[0.02] transition-colors">
              <span className="text-[9px] tracking-[0.3em] text-white/30 uppercase">{stat.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                <span className="text-[10px] text-[#00ff88] font-bold">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-8">
          <button className="bg-[#00ff88] text-black px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#00ff88]/90 transition-all flex items-center gap-3">
            Borrow Now <span className="text-lg">→</span>
          </button>
          
          <button className="border border-white/10 text-white/60 px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:border-white/30 hover:text-white transition-all">
            Documentation
          </button>
          
          <div className="hidden lg:flex items-center gap-4 text-[9px] tracking-[0.4em] text-white/20 uppercase">
            <span className="w-8 h-[1px] bg-white/10"></span>
            Ethereum Mainnet
          </div>
        </div>
      </main>

      {/* Sidebar / Extra Detail (Lo0p Style) */}
      <div className="fixed right-12 bottom-12 hidden xl:block">
        <div className="flex flex-col gap-6 items-end">
          <div className="text-right">
            <div className="text-[10px] tracking-[0.2em] text-[#00ff88] mb-1">● PROTOCOL STATUS</div>
            <div className="text-[9px] tracking-[0.1em] text-white/30">SYNCED JUST NOW</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

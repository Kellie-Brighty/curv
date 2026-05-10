import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <section className="px-8 pb-20 max-w-screen-xl mx-auto w-full font-mono">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Section: LDF Skyline Chart (70%) */}
        <div className="lg:w-[70%] border border-[#1a1a1a] bg-black/20 flex flex-col relative overflow-hidden">
          {/* Chart Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-4 text-[10px] tracking-[0.2em] text-white/50">
              <span className="text-[#00ff88]">● LDF</span>
              <span>100 BANDS × 30 ETH</span>
              <span>V4 NATIVE CURVE</span>
            </div>
            <div className="text-[9px] tracking-[0.1em] text-white/30">
              LIVE - SYNCED JUST NOW
            </div>
          </div>

          {/* Chart Visualization Placeholder */}
          <div className="flex-1 min-h-[400px] p-6 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/[0.03]"></div>
              ))}
            </div>

            {/* Stylized SVG Chart */}
            <svg className="w-full h-full relative z-10" viewBox="0 0 800 300">
              {/* Curve 1 (Orange-ish) */}
              <path 
                d="M 0 50 Q 150 250 800 280" 
                fill="none" 
                stroke="#ff9900" 
                strokeWidth="1.5" 
                strokeOpacity="0.6"
              />
              {/* Curve 2 (Green dashed) */}
              <path 
                d="M 0 280 Q 400 200 800 50" 
                fill="none" 
                stroke="#00ff88" 
                strokeWidth="1" 
                strokeDasharray="4 4"
                strokeOpacity="0.4"
              />
              
              {/* Vertical Selection Line */}
              <line x1="220" y1="50" x2="220" y2="280" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" />
              <circle cx="220" cy="225" r="4" fill="#00ff88" className="animate-pulse" />
              
              {/* Labels */}
              <text x="230" y="228" className="fill-white/60 text-[10px] uppercase tracking-widest font-mono">
                DEBT - 21.22 ETH
              </text>
            </svg>

            {/* X-Axis Labels */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[8px] text-white/20 tracking-widest">
              <span>0</span>
              <span>60</span>
              <span>120</span>
              <span>180</span>
              <span>240</span>
              <span>300</span>
              <span>360</span>
              <span>420</span>
              <span>480</span>
              <span>540</span>
              <span>600</span>
            </div>
          </div>
        </div>

        {/* Right Section: Execute Panel (30%) */}
        <div className="lg:w-[30%] border border-[#1a1a1a] bg-black/20 flex flex-col">
          {/* Execute Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a]">
            <div className="text-[10px] tracking-[0.2em] text-[#00ff88] uppercase font-bold">
              ● Execute
            </div>
            <div className="text-[9px] tracking-[0.1em] text-white/30">
              READY
            </div>
          </div>

          {/* Action Tabs */}
          <div className="grid grid-cols-4 border-b border-[#1a1a1a]">
            {['BUY', 'SELL', 'BORROW', 'REPAY'].map((tab) => (
              <button 
                key={tab} 
                className={`py-4 text-[9px] font-bold tracking-widest transition-colors ${
                  tab === 'BORROW' ? 'bg-[#1a1a1a] text-[#00ff88]' : 'text-white/40 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Input Section */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-[9px] tracking-widest text-white/30 uppercase">
                <span>You Pay</span>
                <span>bal —</span>
              </div>
              <div className="bg-white/[0.03] border border-[#1a1a1a] p-4 flex justify-between items-center group focus-within:border-[#00ff88]/50 transition-colors">
                <span className="text-xl font-bold text-white/20">0.0000</span>
                <div className="flex items-center gap-3">
                  <button className="text-[9px] border border-white/10 px-2 py-1 text-white/40 hover:text-white hover:border-white/30 transition-all uppercase">Max</button>
                  <span className="text-sm font-bold uppercase tracking-widest">ETH</span>
                </div>
              </div>
              <div className="text-[9px] tracking-widest text-white/20">≈ $0.00</div>
            </div>

            <div className="flex justify-center py-2 opacity-20">
              <span className="text-xs">↓</span>
            </div>

            {/* Output Section */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-[9px] tracking-widest text-white/30 uppercase">
                <span>You Receive</span>
              </div>
              <div className="bg-white/[0.03] border border-[#1a1a1a] p-4 flex justify-between items-center group">
                <span className="text-xl font-bold text-[#00ff88]">0</span>
                <span className="text-sm font-bold uppercase tracking-widest">LOOP</span>
              </div>
            </div>

            {/* Connect Wallet Button */}
            <button className="mt-4 bg-[#00ff88] text-black w-full py-4 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#00ff88]/90 transition-all">
              <span className="text-lg">⌨</span> Connect Wallet →
            </button>

            {/* Transaction Settings */}
            <div className="flex justify-between items-center text-[8px] tracking-[0.2em] text-white/20 uppercase mt-4">
              <span>Slippage</span>
              <div className="flex gap-2">
                {['1%', '3%', '5%'].map(s => (
                  <button key={s} className="border border-white/5 px-2 py-1 hover:border-white/20 transition-all">{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Dashboard;

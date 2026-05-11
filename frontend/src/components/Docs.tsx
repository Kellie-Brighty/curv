import React from 'react';
import { motion } from 'framer-motion';

const Docs: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 lg:p-24 space-y-20 font-mono"
    >
      {/* Hero Section */}
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-6xl font-serif italic text-white leading-tight">
          Curv Protocol <br />
          <span className="text-[#00ff88] font-sans font-black uppercase tracking-tighter text-5xl">Technical Whitepaper</span>
        </h1>
        <p className="text-[#999999] text-sm leading-relaxed uppercase tracking-widest">
          The first lending-native Uniswap V4 Hook. Curv transforms AMM liquidity into a high-efficiency borrowable depth engine.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Navigation Sidebar (Desktop) */}
        <div className="hidden lg:block col-span-3 space-y-4 pt-4 border-r border-[#1A1A1A]">
          {['Core Concept', 'The Hook Architecture', 'Lending Mechanics', 'Risk & Liquidations'].map((item) => (
            <div key={item} className="text-[10px] text-[#666666] hover:text-[#00ff88] cursor-pointer transition-colors tracking-[0.2em] font-bold uppercase">
              {item}
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="col-span-12 lg:col-span-9 space-y-16">
          <section className="space-y-6">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]"></span>
              01 // Core Concept
            </h2>
            <p className="text-[#999999] text-sm leading-relaxed">
              Curv is a decentralized lending protocol built directly on top of Uniswap V4. Unlike traditional lending markets that rely on isolated pools, Curv utilizes the "Curv Engine" hook to turn the liquidity inside a Uniswap V4 pool into native collateral. 
              <br /><br />
              This means the same assets that facilitate trades also serve as the backing for loans, maximizing capital efficiency for liquidity providers.
            </p>
          </section>

          <section className="space-y-6 border-t border-[#1A1A1A] pt-12">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]"></span>
              02 // Lending Mechanics
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#050505] border border-[#1A1A1A] p-8 space-y-4">
                <h3 className="text-[#00ff88] text-[10px] font-bold uppercase tracking-widest">Deposit</h3>
                <p className="text-[#666666] text-xs leading-relaxed">
                  Users deposit CURV tokens as collateral into the Curv Engine hook. This collateral is locked and used to determine the user's borrowing capacity.
                </p>
              </div>
              <div className="bg-[#050505] border border-[#1A1A1A] p-8 space-y-4">
                <h3 className="text-[#00ff88] text-[10px] font-bold uppercase tracking-widest">Borrow</h3>
                <p className="text-[#666666] text-xs leading-relaxed">
                  Borrowers can withdraw native ETH against their locked CURV. The borrowing limit is set at 40% LTV (Loan-to-Value) to ensure protocol safety.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6 border-t border-[#1A1A1A] pt-12">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]"></span>
              03 // The Oracle
            </h2>
            <p className="text-[#999999] text-sm leading-relaxed italic border-l-2 border-[#00ff88] pl-6">
              "Price discovery is continuous. Liquidations are inevitable."
            </p>
            <p className="text-[#999999] text-sm leading-relaxed">
              The protocol utilizes a high-precision Time-Weighted Average Price (TWAP) oracle derived directly from the underlying Uniswap V4 pool. By tapping into the pool's native tick state, the lending engine maintains an accurate, manipulation-resistant price feed for CURV, ensuring continuous price discovery and fair liquidation thresholds.
            </p>
          </section>
        </div>
      </div>

    </motion.div>
  );
};

export default Docs;

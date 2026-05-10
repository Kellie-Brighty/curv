import React from 'react';

const Manifesto: React.FC = () => {
  const params = [
    { label: 'Token', value: 'CURV' },
    { label: 'Max Supply', value: '1,000,000' },
    { label: 'LTV', value: '40%' },
    { label: 'Fee', value: '1.00%' },
    { label: 'Chain', value: 'Ethereum' },
  ];

  return (
    <section className="border-y border-[#1A1A1A] bg-black font-mono">
      <div className="max-w-screen-xl mx-auto grid grid-cols-12 min-h-[300px]">
        {/* Left Side: Copy */}
        <div className="col-span-12 lg:col-span-8 p-12 lg:p-16 border-r border-[#1A1A1A] flex flex-col justify-center">
          <h2 className="font-serif italic font-light text-5xl md:text-6xl text-white mb-8 leading-tight">
            Liquidity that <br />
            <span className="text-[#00ff88]">does work.</span>
          </h2>
          <p className="text-[12px] md:text-[13px] leading-relaxed text-[#999999] max-w-xl font-mono uppercase tracking-wider">
            curv is a Uniswap V4 hook that transforms AMM liquidity into borrowable depth. 
            By utilizing the constant-product curve as a lending engine, users can 
            mint, burn, and borrow against native collateral with zero slippage 
            and self-healing liquidations.
          </p>
        </div>

        {/* Right Side: Protocol Params */}
        <div className="col-span-12 lg:col-span-4 p-12 lg:p-16 flex flex-col justify-center bg-[#050505]">
          <h3 className="text-[10px] tracking-[0.4em] text-[#00ff88] font-bold uppercase mb-8 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></span>
            Protocol Params
          </h3>
          <div className="space-y-4">
            {params.map((param, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] tracking-widest text-[#999999] uppercase">{param.label}</span>
                <span className="text-[11px] font-bold text-white tracking-widest uppercase">{param.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Manifesto;

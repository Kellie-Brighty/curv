import React from 'react';
import { motion } from 'framer-motion';

const FlowDiagram: React.FC = () => {
  const lineVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 }
    }
  };

  const nodeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-black">
      <div className="relative w-full max-w-4xl flex justify-between items-center px-12">
        {/* Connection Lines */}
        <div className="absolute inset-0 flex items-center px-24">
           <svg className="w-full h-1" viewBox="0 0 100 1" preserveAspectRatio="none">
             <motion.line 
               x1="0" y1="0.5" x2="100" y2="0.5" 
               stroke="#00ff88" 
               strokeWidth="0.1"
               strokeDasharray="2, 2"
               variants={lineVariants}
               initial="initial"
               animate="animate"
             />
           </svg>
        </div>

        {/* Step 1: CURV */}
        <motion.div 
          variants={nodeVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="h-20 w-20 rounded-full border-2 border-[#00ff88] bg-black flex items-center justify-center shadow-[0_0_30px_rgba(0,255,136,0.2)]">
            <span className="text-[#00ff88] font-black text-xs tracking-tighter uppercase">CURV</span>
          </div>
          <div className="text-center space-y-1">
            <span className="text-[10px] text-white font-bold uppercase tracking-[0.2em]">Deposit</span>
            <p className="text-[8px] text-[#666666] uppercase tracking-widest">User Collateral</p>
          </div>
        </motion.div>

        {/* Step 2: HOOK */}
        <motion.div 
          variants={nodeVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="h-24 w-24 rounded-lg border-2 border-[#00ff88] bg-[#00ff88]/5 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,136,0.3)] rotate-45">
            <div className="-rotate-45 flex flex-col items-center">
              <span className="text-[#00ff88] font-black text-[10px] tracking-tighter uppercase">HOOK</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <span className="text-[10px] text-[#00ff88] font-bold uppercase tracking-[0.2em]">LOCKED</span>
            <p className="text-[8px] text-[#666666] uppercase tracking-widest">Protocol Engine</p>
          </div>
        </motion.div>

        {/* Step 3: ETH */}
        <motion.div 
          variants={nodeVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 1.0 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="h-20 w-20 rounded-full border-2 border-white bg-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <span className="text-white font-black text-xs tracking-tighter uppercase">ETH</span>
          </div>
          <div className="text-center space-y-1">
            <span className="text-[10px] text-white font-bold uppercase tracking-[0.2em]">Borrow</span>
            <p className="text-[8px] text-[#666666] uppercase tracking-widest">Native Depth</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FlowDiagram;

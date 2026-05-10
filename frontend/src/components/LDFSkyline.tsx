import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface LDFSkylineProps {
  onUpdate?: (reserve: string, price: string) => void;
  refreshKey?: number;
}

const LDFSkyline: React.FC<LDFSkylineProps> = ({ onUpdate, refreshKey = 0 }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const chartHeight = 400;
  const chartWidth = 1000;

  // Math for the curves - will "randomize" slightly on refreshKey update
  const getSupplyY = (x: number) => {
    const normalizedX = x / chartWidth;
    const shift = (refreshKey % 10) * 0.01;
    return chartHeight - (chartHeight * (0.8 + shift) * (1 - Math.exp(-normalizedX * (5 + shift))));
  };

  const getPriceY = (x: number) => {
    const normalizedX = x / chartWidth;
    const shift = (refreshKey % 5) * 0.005;
    return chartHeight - (chartHeight * (0.1 + shift) * Math.exp(normalizedX * (3 + shift)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * chartWidth;
      const y = ((e.clientY - rect.top) / rect.height) * chartHeight;
      setMousePos({ x, y });

      if (onUpdate) {
        const reserveValue = (x * 1.5 + 800 + (refreshKey * 10));
        const reserve = reserveValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const price = (0.001757 + (x / 100000) + (refreshKey * 0.000001)).toFixed(6);
        onUpdate(reserve, price);
      }
    }
  };

  // Paths regenerate when refreshKey changes
  const supplyPath = useMemo(() => {
    let d = `M 0 ${chartHeight}`;
    for (let x = 0; x <= chartWidth; x += 5) {
      d += ` L ${x} ${getSupplyY(x)}`;
    }
    d += ` L ${chartWidth} ${chartHeight} Z`;
    return d;
  }, [refreshKey]);

  const pricePath = useMemo(() => {
    let d = `M 0 ${getPriceY(0)}`;
    for (let x = 0; x <= chartWidth; x += 5) {
      d += ` L ${x} ${getPriceY(x)}`;
    }
    return d;
  }, [refreshKey]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-black relative select-none font-mono overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (onUpdate) onUpdate('1,240.50', '0.001757');
      }}
    >
      <svg 
        key={refreshKey} // Force SVG re-render to trigger animations
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="supply-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid Lines */}
        {[...Array(11)].map((_, i) => (
          <line key={`v-${i}`} x1={(chartWidth / 10) * i} y1="0" x2={(chartWidth / 10) * i} y2={chartHeight} stroke="#1a1a1a" strokeWidth="1" />
        ))}
        <line x1="0" y1={chartHeight - 1} x2={chartWidth} y2={chartHeight - 1} stroke="#1a1a1a" strokeWidth="2" />

        {/* Curves */}
        <motion.path 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d={supplyPath}
          fill="url(#supply-gradient)"
          stroke="#00ff88"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 5px rgba(0,255,136,0.3))' }}
        />

        <motion.path 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          d={pricePath}
          fill="none"
          stroke="#B38136"
          strokeWidth="2"
        />

        {/* Data Nodes */}
        <g transform={`translate(${chartWidth * 0.3}, ${getSupplyY(chartWidth * 0.3)})`}>
          <circle r="5" fill="#ff4d4d" filter="url(#glow)" />
          <text y="20" textAnchor="middle" className="fill-[#ff4d4d] text-[10px] uppercase font-bold">Burn</text>
        </g>
        <g transform={`translate(${chartWidth * 0.6}, ${getSupplyY(chartWidth * 0.6)})`}>
          <circle r="6" fill="#4DE4FF" filter="url(#glow)" />
          <text y="-15" textAnchor="middle" className="fill-[#4DE4FF] text-[10px] uppercase font-bold tracking-widest animate-pulse">Live Price</text>
        </g>
        <g transform={`translate(${chartWidth * 0.85}, ${getSupplyY(chartWidth * 0.85)})`}>
          <circle r="5" fill="#00ff88" filter="url(#glow)" />
          <text y="20" textAnchor="middle" className="fill-[#00ff88] text-[10px] uppercase font-bold">Mint</text>
        </g>

        {isHovering && (
          <g>
            <line x1={mousePos.x} y1="0" x2={mousePos.x} y2={chartHeight} stroke="#999999" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx={mousePos.x} cy={getSupplyY(mousePos.x)} r="4" fill="#00ff88" />
            <circle cx={mousePos.x} cy={getPriceY(mousePos.x)} r="4" fill="#B38136" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default LDFSkyline;

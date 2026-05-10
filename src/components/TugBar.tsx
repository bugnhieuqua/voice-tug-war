import React from 'react';
import { motion } from 'motion/react';

interface TugBarProps {
  score: number; // ranges from -100 to 100
  playerTeam?: 'left' | 'right';
}

export const TugBar: React.FC<TugBarProps> = ({ score, playerTeam }) => {
  // Map score (-100 to 100) to percentage (0% to 100%)
  const percentage = ((score + 100) / 200) * 100;

  const leftLabel = playerTeam === 'left' ? 'BẠN' : 'ĐỐI THỦ';
  const rightLabel = playerTeam === 'right' ? 'BẠN' : 'ĐỐI THỦ';

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Labels */}
      <div className="flex justify-between px-1">
        <span className={`text-[11px] font-black italic tracking-widest uppercase ${playerTeam === 'left' ? 'text-blue-400' : 'text-gray-500'}`}>
          {leftLabel}
        </span>
        <span className={`text-[11px] font-black italic tracking-widest uppercase ${playerTeam === 'right' ? 'text-red-400' : 'text-gray-500'}`}>
          {rightLabel}
        </span>
      </div>

      <div className="relative w-full h-8 md:h-10 bg-gray-950/80 rounded-2xl border-2 border-white/5 overflow-hidden shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {/* Left Side (Blue) */}
        <div className="absolute inset-0 bg-blue-600/10" />
        
        {/* Right Side (Red) */}
        <motion.div 
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 25 }}
          className="absolute top-0 right-0 h-full bg-gradient-to-l from-red-600 via-orange-500 to-red-600 shadow-[-10px_0_30px_rgba(239,68,68,0.5)]"
        />

        {/* Center Marker / Rope Handle */}
        <motion.div
          animate={{ left: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 25 }}
          className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_25px_rgba(255,255,255,1)] z-10 -translate-x-1/2"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_white]" />
        </motion.div>

        {/* Dynamic Glow Effect when intense */}
        {(score > 70 || score < -70) && (
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
            className={`absolute inset-0 pointer-events-none ${score > 70 ? 'bg-red-500/30' : 'bg-blue-500/30'}`}
          />
        )}
      </div>
    </div>
  );
};

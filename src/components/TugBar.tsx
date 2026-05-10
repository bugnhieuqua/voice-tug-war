import { motion } from 'motion/react';
import { cn } from './DogCharacter';

export function TugBar({ score }: { score: number }) {
  // Score goes from -100 (left wins) to +100 (right wins)
  // Maps to a percentage. -100 -> 0%, 0 -> 50%, 100 -> 100%
  const clampScore = Math.max(-100, Math.min(100, score));
  const fillPercentage = 50 + (clampScore / 2);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center mt-12 mb-8 relative z-10 px-4">
      {/* Container */}
      <div className="w-full h-12 md:h-16 bg-gray-900/80 backdrop-blur-md rounded-full border-4 border-gray-800 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        
        {/* Fill */}
        <motion.div 
          className="h-full absolute top-0 left-0 bg-gradient-to-r from-red-600 to-red-400 z-10 origin-left"
          animate={{ width: `${fillPercentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        />
        
        <motion.div 
          className="h-full absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-blue-400 origin-right object-cover"
          animate={{ width: `${100 - fillPercentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        />

        {/* Center Marker */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2 bg-yellow-400 z-30 shadow-[0_0_10px_rgba(255,255,0,0.8)]" />
        
        {/* Moving Rope Marker */}
        <motion.div 
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center z-40"
          animate={{ left: `${fillPercentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={{ x: '-50%' }}
        >
           <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full border-4 border-yellow-500 shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center">
             <div className="w-4 h-4 bg-yellow-500 rounded-full" />
           </div>
        </motion.div>
      </div>

      <div className="flex justify-between w-full mt-4 text-white/50 text-xs font-bold font-mono tracking-widest">
        <span>RED TEAM</span>
        <span>BLUE TEAM</span>
      </div>
    </div>
  );
}

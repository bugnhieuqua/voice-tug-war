import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface DogCharacterProps {
  team: "left" | "right";
  volume: number;
  label: string;
  isWinner?: boolean;
  isLoser?: boolean;
}

export const DogCharacter: React.FC<DogCharacterProps> = ({
  team,
  volume,
  label,
  isWinner,
  isLoser,
}) => {
  // Volume scaling logic - Focus on Scaling instead of Moving Up
  const scale = 1 + volume / 180; // Phóng to mạnh hơn khi hét
  const isSpeaking = volume > 10;

  const dogImg =
    "https://i.pinimg.com/736x/6e/5b/ab/6e5bab41f576d5908eb2cacb2c302b25.jpg";

  return (
    <div
      className={`relative flex flex-col items-center flex-1 max-w-[28%] mt-12 transition-all duration-500 ${isLoser ? "grayscale opacity-40 scale-90" : ""}`}
    >
      <div className="relative w-full aspect-[4/5] flex items-center justify-center">
        {/* SOUND WAVE PARTICLES */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.7, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className={`absolute inset-0 rounded-[2rem] border-4 ${team === "left" ? "border-blue-500/50" : "border-red-500/50"} z-0`}
              />
            </>
          )}
        </AnimatePresence>
        
        {/* WINNER CROWN */}
        <AnimatePresence>
          {isWinner && (
            <motion.div
              initial={{ y: -20, opacity: 0, rotate: -10 }}
              animate={{ y: -45, opacity: 1, rotate: 0 }}
              className="absolute top-0 z-30 flex flex-col items-center"
            >
              <div className="bg-yellow-500 text-gray-950 text-[10px] font-black px-3 py-1 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.8)] border-2 border-white uppercase italic tracking-tighter">
                CHAMPION
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* GLOW EFFECT */}
        <motion.div
          animate={{
            boxShadow: isSpeaking
              ? `0 0 ${volume}px ${volume / 4}px ${team === "left" ? "rgba(59,130,246,0.3)" : "rgba(239,68,68,0.3)"}`
              : "0 0 15px rgba(0,0,0,0.3)",
          }}
          className="relative z-10 w-full h-full rounded-[2rem] overflow-hidden border-[3px] border-white/20 shadow-2xl bg-gray-950"
        >
          {/* DOG IMAGE WITH SCALE/BOUNCE ANIMATION */}
          <motion.div
            animate={{
              scale: isWinner ? [1, 1.15, 1] : scale,
              rotate: isSpeaking ? [0, -1, 1, 0] : 0
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 15,
              scale: isWinner ? { repeat: Infinity, duration: 1 } : undefined
            }}
            className="w-full h-full relative"
          >
            <img
              src={dogImg}
              alt="Dog Fighter"
              className={`w-full h-full object-cover ${team === "right" ? "-scale-x-100" : ""}`}
            />

            {/* Label Overlay */}
            <div
              className={`absolute bottom-0 left-0 right-0 py-2 text-center backdrop-blur-md border-t border-white/10 ${
                team === "left"
                  ? "bg-blue-600/90 text-white"
                  : "bg-red-600/90 text-white"
              }`}
            >
              <span className="text-[clamp(9px,1.8vw,11px)] font-black italic tracking-widest uppercase">
                {label}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* SPEAKING PARTICLES */}
        {isSpeaking && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 60),
                  y: -(Math.random() * 60),
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full ${team === "left" ? "bg-blue-400" : "bg-red-400"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* VOLUME BAR */}
      <div className="mt-4 w-full h-1.5 bg-gray-950/50 rounded-full overflow-hidden border border-white/10 shadow-inner">
        <motion.div
          animate={{ 
            width: `${Math.min(volume, 100)}%`,
            backgroundColor: isSpeaking ? (team === 'left' ? '#60a5fa' : '#f87171') : (team === 'left' ? '#3b82f6' : '#ef4444')
          }}
          className={`h-full rounded-full transition-colors ${team === "left" ? "shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "shadow-[0_0_15px_rgba(239,68,68,0.5)]"}`}
        />
      </div>
    </div>
  );
};

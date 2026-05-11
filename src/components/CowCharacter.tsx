import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "motion/react";

interface CowCharacterProps {
  team: "left" | "right";
  volume: number;
  label: string;
  isWinner?: boolean;
  isLoser?: boolean;
}

export const CowCharacter: React.FC<CowCharacterProps> = ({
  team,
  volume,
  label,
  isWinner,
  isLoser,
}) => {
  // Smoothing volume for animation
  const springVolume = useSpring(0, { stiffness: 200, damping: 20 });
  
  useEffect(() => {
    springVolume.set(volume);
  }, [volume, springVolume]);

  const mouthScale = useTransform(springVolume, [0, 100], [0.1, 1.5]);
  const headY = useTransform(springVolume, [0, 100], [0, -20]);
  const headRotate = useTransform(springVolume, [0, 100], [0, team === "left" ? -5 : 5]);
  
  const isSpeaking = volume > 10;
  const isIntense = volume > 80;

  // Blinking logic
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div
      className={`relative flex flex-col items-center flex-1 max-w-[32%] mt-12 transition-all duration-700 ${
        isLoser ? "grayscale opacity-30 scale-90 translate-y-10" : ""
      }`}
    >
      <div className="relative w-full aspect-[1/1.2] flex items-center justify-center">
        
        {/* INTENSE EFFECTS: AURA & MOTION LINES */}
        <AnimatePresence>
          {isIntense && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className={`absolute inset-0 rounded-full blur-3xl z-0 ${
                  team === "left" ? "bg-blue-500/40" : "bg-red-500/40"
                }`}
              />
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 200, 
                      y: (Math.random() - 0.5) * 200, 
                      opacity: [0, 1, 0] 
                    }}
                    transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.05 }}
                    className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-white/20 -translate-x-1/2"
                    style={{ rotate: i * 60 }}
                  />
                ))}
              </div>
            </>
          )}
        </AnimatePresence>

        {/* WINNER CHAMPION LABEL */}
        <AnimatePresence>
          {isWinner && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0 }}
              animate={{ y: -60, opacity: 1, scale: 1.2 }}
              className="absolute top-0 z-40 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-950 text-[10px] font-black px-4 py-1 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.6)] border-2 border-white uppercase italic tracking-widest"
            >
              COW CHAMPION
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHARACTER CONTAINER */}
        <motion.div
          animate={{
            y: isSpeaking ? [0, -5, 0] : [0, 5, 0],
            scaleY: isSpeaking ? 1 : [1, 0.98, 1], // Breathing effect
          }}
          transition={{
            y: { repeat: Infinity, duration: isSpeaking ? 0.2 : 3 },
            scaleY: { repeat: Infinity, duration: 4 },
          }}
          className="relative z-10 w-full h-full flex flex-col items-center"
        >
          {/* BODY LAYER */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/cow.png"
              className={`w-full h-full object-contain ${team === "right" ? "-scale-x-100" : ""}`}
              alt="Cow Body"
            />
          </div>

          {/* HEAD & FACE LAYER (Floating/Reacting) */}
          <motion.div
            style={{ y: headY, rotate: headRotate }}
            className="relative w-full h-full pointer-events-none"
          >
            {/* EYES (Blinking) */}
            <div className="absolute top-[35%] left-[35%] right-[35%] flex justify-between px-[10%]">
              <motion.div 
                animate={{ scaleY: isBlinking ? 0.1 : 1 }}
                className="w-3 h-3 bg-gray-900 rounded-full shadow-inner border border-white/20" 
              />
              <motion.div 
                animate={{ scaleY: isBlinking ? 0.1 : 1 }}
                className="w-3 h-3 bg-gray-900 rounded-full shadow-inner border border-white/20" 
              />
            </div>

            {/* MOUTH (Dynamic Realtime) */}
            <div className="absolute top-[52%] left-1/2 -translate-x-1/2 w-[25%] h-[20%] flex items-center justify-center">
              <motion.div
                style={{ scaleY: mouthScale }}
                className="w-full h-full bg-gray-950 rounded-b-full border-t-2 border-pink-400/30 overflow-hidden relative"
              >
                {/* TONGUE */}
                <motion.div 
                  animate={{ y: isSpeaking ? [2, -2, 2] : 2 }}
                  transition={{ repeat: Infinity, duration: 0.2 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-red-500 rounded-t-full" 
                />
              </motion.div>
            </div>
            
            {/* NOSTRILS/FLAIR */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[30%] flex justify-between px-2"
                >
                  <div className="w-1.5 h-1.5 bg-pink-300/40 rounded-full blur-[1px]" />
                  <div className="w-1.5 h-1.5 bg-pink-300/40 rounded-full blur-[1px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* MOO PARTICLES */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                key={Math.floor(Date.now() / 200)} // Emit periodically
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -80, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute top-[40%] text-white font-black italic text-xl drop-shadow-lg z-50"
              >
                {isIntense ? "MOOOOOO!!!" : "moo~"}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* SHADOW */}
        <motion.div
          animate={{ scale: isSpeaking ? 0.9 : 1, opacity: isSpeaking ? 0.4 : 0.6 }}
          className="absolute -bottom-4 w-1/2 h-4 bg-black/40 blur-md rounded-full z-0"
        />
      </div>

      {/* LABEL & VOLUME */}
      <div className="mt-8 w-full flex flex-col items-center gap-2">
        <div className={`px-4 py-1 rounded-full text-[10px] font-black italic uppercase tracking-widest ${
          team === "left" ? "bg-blue-600 text-white" : "bg-red-600 text-white"
        }`}>
          {label}
        </div>
        
        <div className="w-full h-2 bg-gray-950/50 rounded-full overflow-hidden border border-white/10 p-0.5">
          <motion.div
            style={{ width: `${volume}%` }}
            className={`h-full rounded-full ${
              team === "left" ? "bg-blue-400 shadow-[0_0_15px_blue]" : "bg-red-400 shadow-[0_0_15px_red]"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

import { memo } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DogCharacter = memo(function DogCharacter({ 
  volume, 
  team, 
  isWinner, 
  isLoser,
  label
}: { 
  volume: number; 
  team: 'left' | 'right'; 
  isWinner?: boolean;
  isLoser?: boolean;
  label?: string;
}) {
  const isYelling = volume > 15;

  const lift = isYelling ? -(volume / 100) * 40 : 0;
  const scale = isWinner ? 1.5 : isLoser ? 0.8 : 1 + (volume / 100) * 0.3;
  
  const variants = {
    idle: { scale: 1, y: 0, rotate: 0 },
    yelling: { 
      scale, 
      y: lift,
      rotate: team === 'left' ? [-1, 1, -1] : [1, -1, 1],
      transition: {
        y: { type: 'spring', stiffness: 300, damping: 20 },
        rotate: { repeat: Infinity, duration: 0.1 }
      }
    },
    winner: {
      scale: 1.5,
      y: [0, -40, 0],
      rotate: [0, 10, -10, 0],
      transition: { repeat: Infinity, duration: 0.5 }
    },
    loser: {
      scale: 0.8,
      y: 60,
      opacity: 0.3,
      rotate: team === 'left' ? -90 : 90,
      transition: { duration: 0.5 }
    }
  };

  let animationState = 'idle';
  if (isWinner) animationState = 'winner';
  else if (isLoser) animationState = 'loser';
  else if (isYelling) animationState = 'yelling';

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        variants={variants}
        animate={animationState}
        className={cn(
          "w-36 h-36 md:w-56 md:h-56 rounded-3xl overflow-hidden border-8 bg-gray-900 shadow-2xl relative transition-colors duration-300",
          team === 'left' ? 'border-red-500 shadow-red-500/40' : 'border-blue-500 shadow-blue-500/40',
          isYelling && (team === 'left' ? 'shadow-red-500/80' : 'shadow-blue-500/80')
        )}
      >
        <img 
          src="https://i.pinimg.com/736x/ba/8d/16/ba8d1675c50578787597603adf2ce92b.jpg" 
          className={cn(
            "w-full h-full object-cover",
            team === 'right' && "transform scale-x-[-1]"
          )}
          alt="Dog Player" 
        />
        
        {isYelling && !isWinner && !isLoser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: (volume / 100) * 0.6 }}
            className={cn(
              "absolute inset-0 mix-blend-overlay",
              team === 'left' ? 'bg-red-500' : 'bg-blue-500'
            )} 
          />
        )}
      </motion.div>
      
      {isYelling && !isWinner && !isLoser && (
         <div className="absolute -top-12 flex gap-1.5 h-8 items-end">
           {[...Array(5)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ 
                 height: [10, (volume / 100) * 40 + Math.random() * 20, 10],
                 opacity: [0.5, 1, 0.5]
               }}
               transition={{ repeat: Infinity, duration: 0.15 + i * 0.05 }}
               className={cn(
                 "w-2.5 rounded-full",
                 team === 'left' ? "bg-red-500" : "bg-blue-500"
               )}
             />
           ))}
         </div>
      )}

      <motion.div 
        animate={{ scale: isYelling ? 1.1 : 1 }}
        className={cn(
          "mt-6 px-6 py-2 rounded-xl text-white font-black tracking-widest text-base shadow-xl min-w-[120px] text-center",
          team === 'left' ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'
        )}
      >
        {label || (team === 'left' ? 'ĐỘI ĐỎ' : 'ĐỘI XANH')}
      </motion.div>
    </div>
  );
});

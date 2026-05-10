import React from 'react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  bgImage?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, bgImage }) => {
  return (
    <div 
      className="relative w-full h-[100dvh] overflow-hidden bg-gray-950 font-sans selection:bg-yellow-500/30"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Dynamic Background */}
      {bgImage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={bgImage} 
            alt="Background" 
            className="w-full h-full object-cover opacity-40 blur-[2px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-transparent to-gray-950/90" />
        </motion.div>
      )}

      {/* Content Container */}
      <main className="relative z-10 w-full h-full flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Global Noise Overlay for Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

import { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden font-sans selection:bg-yellow-500/30">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-40">
        {/* Soft radial gradients to simulate a "sunset park" mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-purple-900/20 to-gray-950" />
        <div className="absolute left-1/4 top-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
        {/* Grid pattern - Fixed URL */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
      </div>
      
      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}

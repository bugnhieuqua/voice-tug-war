import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Mic, Volume2, Play, LogOut, CheckCircle2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { DogCharacter } from '../components/DogCharacter';
import { TugBar } from '../components/TugBar';
import { socket } from '../socket';
import { useAudioVolume } from '../hooks/useAudioVolume';
import { useSoundEffects } from '../hooks/useSoundEffects';

type RoomState = {
  id: string;
  players: Record<string, { id: string; force: number; team: 'left' | 'right'; ready: boolean }>;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  score: number;
  timeRemaining: number;
  winner: 'left' | 'right' | 'tie' | null;
  countdown: number;
};

export function Room({ 
  roomId, 
  team, 
  onLeave, 
  initialState 
}: { 
  roomId: string, 
  team: 'left' | 'right', 
  onLeave: () => void,
  initialState?: RoomState | null
}) {
  const [room, setRoom] = useState<RoomState | null>(initialState || null);
  const [micEnabled, setMicEnabled] = useState(false);
  const volume = useAudioVolume(micEnabled && room?.status === 'playing');
  const volumeRef = useRef(volume);
  const { playCountdown, playGo, playWin, playLose } = useSoundEffects();

  const prevStatusRef = useRef(room?.status);
  const prevCountdownRef = useRef(room?.countdown);

  useEffect(() => {
    console.log('[Room] Mounted, roomId:', roomId, 'initialState:', initialState);
    
    const handleRoomState = (state: RoomState) => {
      console.log('[Room] Received roomState update:', state);
      setRoom(state);
    };
    
    socket.on('roomState', handleRoomState);
    
    // Explicitly request state as a safety measure on mount
    console.log('[Room] Requesting current room state...');
    socket.emit('getRoomState', roomId, (state: RoomState) => {
      console.log('[Room] Received getRoomState response:', state);
      if (state) setRoom(state);
    });
    
    return () => {
      console.log('[Room] Unmounting, cleaning up listeners...');
      socket.off('roomState', handleRoomState);
      socket.emit('leaveRoom');
    };
  }, [roomId]);

  useEffect(() => {
    if (!room) return;
    
    // Play sounds on state changes
    if (room.status === 'countdown' && prevCountdownRef.current !== room.countdown) {
       if (room.countdown > 0) playCountdown();
    }
    
    if (room.status === 'playing' && prevStatusRef.current === 'countdown') {
       playGo();
    }
    
    if (room.status === 'finished' && prevStatusRef.current === 'playing') {
       if (room.winner === team || room.winner === 'tie') playWin();
       else playLose();
    }
    
    prevStatusRef.current = room.status;
    prevCountdownRef.current = room.countdown;
  }, [room?.status, room?.countdown, room?.winner, team, playCountdown, playGo, playWin, playLose]);

  // Sync local volume ref
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Throttled volume emission
  useEffect(() => {
    if (room?.status === 'playing') {
      const interval = setInterval(() => {
         socket.emit('updateForce', roomId, volumeRef.current);
      }, 100); 
      return () => clearInterval(interval);
    }
  }, [room?.status, roomId]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomId);
  }, [roomId]);

  const handleReady = useCallback(() => {
    setMicEnabled(true);
    socket.emit('playerReady', roomId);
  }, [roomId]);

  const handleLeaveClick = useCallback(() => {
    socket.emit('leaveRoom');
    onLeave();
  }, [onLeave]);

  const players = useMemo(() => room ? Object.values(room.players) : [], [room]);
  const leftPlayer = useMemo(() => players.find(p => p.team === 'left'), [players]);
  const rightPlayer = useMemo(() => players.find(p => p.team === 'right'), [players]);
  const me = useMemo(() => room?.players[socket.id], [room?.players]);
  const isReady = me?.ready;

  if (!room) return <Layout><div className="flex-1 flex items-center justify-center p-8 text-white text-2xl font-bold animate-pulse">Entering Arena...</div></Layout>;

  return (
    <Layout>
      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 mb-6 md:mb-10 shadow-2xl">
          <button 
            onClick={handleLeaveClick} 
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 font-black transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">LEAVE GAME</span>
          </button>
          
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Room Arena</span>
               <span className="text-yellow-400 font-mono font-black tracking-widest text-xl md:text-2xl leading-none">
                 {roomId}
               </span>
            </div>
            <button 
              onClick={handleCopy} 
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 shadow-lg"
              title="Copy Room ID"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tug Bar Area */}
        <div className="h-28 md:h-32">
          <AnimatePresence mode="wait">
            {room.status !== 'waiting' && (
              <motion.div 
                key="tugbar"
                initial={{ opacity: 0, y: -30, filter: 'blur(10px)' }} 
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
                exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
              >
                 <TugBar score={room.score} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Messages / Timer */}
        <div className="flex justify-center my-6 h-20 items-center">
          <AnimatePresence mode="wait">
            {room.status === 'playing' ? (
              <motion.div 
                key="timer"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-6xl md:text-7xl font-black font-mono tabular-nums tracking-tighter drop-shadow-2xl ${
                  room.timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-white'
                }`}
              >
                {room.timeRemaining}s
              </motion.div>
            ) : room.status === 'countdown' ? (
               <motion.div 
                 key={room.countdown}
                 initial={{ scale: 3, opacity: 0, rotate: -10 }}
                 animate={{ scale: 1, opacity: 1, rotate: 0 }}
                 className="text-8xl font-black text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)] italic"
               >
                 {room.countdown}
               </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Character Battle Arena */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-12 relative pb-24">
           
           {/* Left Arena */}
           <motion.div 
             animate={{ x: room.status === 'playing' ? -(room.score / 2) : 0 }}
             className="flex flex-col items-center"
           >
             <DogCharacter 
               team="left" 
               volume={leftPlayer?.id === socket.id ? volume : (leftPlayer?.force || 0)} 
               isWinner={room.status === 'finished' && room.winner === 'left'}
               isLoser={room.status === 'finished' && room.winner === 'right'}
             />
           </motion.div>

           {/* VS Badge */}
           <div className="bg-white text-gray-950 font-black italic text-5xl p-6 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] z-10 border-8 border-gray-900 -rotate-12 scale-75 md:scale-100">
             VS
           </div>

           {/* Right Arena */}
           <motion.div 
             animate={{ x: room.status === 'playing' ? -(room.score / 2) : 0 }}
             className="flex flex-col items-center"
           >
              <DogCharacter 
                team="right" 
                volume={rightPlayer?.id === socket.id ? volume : (rightPlayer?.force || 0)}
                isWinner={room.status === 'finished' && room.winner === 'right'}
                isLoser={room.status === 'finished' && room.winner === 'left'}
              />
           </motion.div>
        </div>

        {/* Game State Overlays */}
        <div className="fixed inset-x-0 bottom-12 flex justify-center z-50 pointer-events-none">
           <AnimatePresence>
             {room.status === 'waiting' && (
               <motion.div 
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: 100, opacity: 0 }}
                 className="bg-gray-900 border-2 border-gray-700 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center max-w-md w-full pointer-events-auto mx-4"
               >
                 <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
                   Waiting for Arena
                 </h3>
                 <p className="text-gray-500 font-bold mb-6">Players: {players.length}/2</p>
                 
                 {!isReady ? (
                   <button 
                     onClick={handleReady}
                     className="w-full bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-yellow-300 hover:to-orange-500 text-gray-950 font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(250,204,21,0.3)] active:scale-95 transition-all"
                   >
                     <Mic className="w-6 h-6" />
                     ACTIVATE MIC & READY
                   </button>
                 ) : (
                   <div className="w-full text-green-400 font-black flex items-center justify-center gap-3 bg-green-400/10 py-4 px-8 rounded-2xl border-2 border-green-400/30 italic">
                     <CheckCircle2 className="w-6 h-6" />
                     STANDBY...
                   </div>
                 )}
               </motion.div>
             )}

             {room.status === 'finished' && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0, y: 100 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="bg-gray-950 border-4 border-yellow-500 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(250,204,21,0.4)] text-center max-w-md w-full pointer-events-auto mx-4"
                >
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-7xl mb-6"
                  >
                    🏆
                  </motion.div>
                  <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-8 italic uppercase tracking-tighter">
                    {room.winner === 'tie' ? "DRAW!" : room.winner === team ? 'VICTORY' : 'DEFEAT'}
                  </h2>
                  
                  <button 
                    onClick={handleLeaveClick}
                    className="w-full bg-white text-gray-950 hover:bg-gray-200 font-black py-5 px-10 rounded-2xl transition-all shadow-xl active:scale-95 text-xl"
                  >
                    RETURN HOME
                  </button>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

      </div>
    </Layout>
  );
}

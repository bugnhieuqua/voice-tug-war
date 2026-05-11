import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../socket';
import { Layout } from '../components/Layout';
import { DogCharacter } from '../components/DogCharacter';
import { TugBar } from '../components/TugBar';
import { useAudioVolume } from '../hooks/useAudioVolume';
import { Mic, CheckCircle2, LogOut, Copy, AlertCircle } from 'lucide-react';

const countdownAudio = new Audio('https://www.soundjay.com/buttons/beep-07.wav');
const victoryAudio = new Audio('/win.mp3');
const defeatAudio = new Audio('/thua.mp3');

export function Room({ roomId, team: propTeam, initialState, onLeave }: { 
  roomId: string; 
  team: 'left' | 'right';
  initialState?: any;
  onLeave: () => void;
}) {
  const [room, setRoom] = useState<any>(initialState || null);
  const [team, setTeam] = useState<'left' | 'right' | null>(propTeam || null);
  const [micActive, setMicActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const volume = useAudioVolume(micActive && room?.status === 'playing');
  
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);

  const prevStatusRef = useRef(room?.status);
  const prevCountdownRef = useRef(room?.countdown);

  const stopAllMusic = () => {
    victoryAudio.pause();
    victoryAudio.currentTime = 0;
    defeatAudio.pause();
    defeatAudio.currentTime = 0;
  };

  const handleRoomState = useCallback((newState: any) => {
    setRoom(newState);
  }, []);

  useEffect(() => {
    victoryAudio.load();
    defeatAudio.load();

    if (!initialState) {
       socket.emit('getRoomState', roomId, (res: any) => {
          if (res?.roomState) {
            setRoom(res.roomState);
            if (res.team) setTeam(res.team);
          }
       });
    }

    socket.on('roomState', handleRoomState);
    socket.on('rematch-pending', (data) => {
      if (data.from !== socket.id) setOpponentWantsRematch(true);
    });
    socket.on('room-rematch', () => {
      setRematchRequested(false);
      setOpponentWantsRematch(false);
    });
    
    return () => {
      stopAllMusic();
      socket.off('roomState');
      socket.off('rematch-pending');
      socket.off('room-rematch');
      socket.emit('leaveRoom');
    };
  }, [roomId, initialState, handleRoomState]);

  useEffect(() => {
    if (!room) return;
    
    if (room.status === 'countdown' && prevCountdownRef.current !== room.countdown) {
       if (room.countdown > 0) {
          countdownAudio.currentTime = 0;
          countdownAudio.play().catch(() => {});
       }
    }

    if (room.status === 'finished' && prevStatusRef.current !== 'finished') {
       if (room.winner === team) {
          victoryAudio.currentTime = 0;
          victoryAudio.play().catch(() => {});
       } else if (room.winner !== 'tie') {
          defeatAudio.currentTime = 0;
          defeatAudio.play().catch(() => {});
       }
    }

    prevStatusRef.current = room.status;
    prevCountdownRef.current = room.countdown;
  }, [room, team]);

  const handleReady = () => {
    setAudioUnlocked(true);
    setMicActive(true);
    socket.emit('playerReady', roomId);
    if (window.AudioContext || (window as any).webkitAudioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    }
  };

  const handleRematch = useCallback(() => {
    stopAllMusic();
    socket.emit('rematch-request', roomId);
    setRematchRequested(true);
  }, [roomId]);

  useEffect(() => {
    if (micActive && room?.status === 'playing') {
      const interval = setInterval(() => {
        socket.emit('updateForce', roomId, volume);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [micActive, room?.status, roomId, volume]);

  const players = useMemo(() => room ? Object.values(room.players) : [], [room]);
  const leftPlayer: any = useMemo(() => players.find((p: any) => p.team === 'left'), [players]);
  const rightPlayer: any = useMemo(() => players.find((p: any) => p.team === 'right'), [players]);
  const leftVolume = useMemo(() => leftPlayer?.id === socket.id ? volume : (leftPlayer?.force || 0), [leftPlayer, volume]);
  const rightVolume = useMemo(() => rightPlayer?.id === socket.id ? volume : (rightPlayer?.force || 0), [rightPlayer, volume]);

  if (!room) return <Layout><div className="flex-1 flex items-center justify-center text-white font-black italic">CONNECTING...</div></Layout>;

  return (
    <Layout bgImage="https://i.pinimg.com/1200x/f8/bb/c7/f8bbc7bb3b77869d2762d1ede25ebcbf.jpg">
      <motion.div 
        animate={room?.status === 'playing' && (leftVolume > 50 || rightVolume > 50) ? {
          x: [0, -2, 2, -1, 1, 0],
          y: [0, 1, -1, 2, -2, 0]
        } : {}}
        transition={{ repeat: Infinity, duration: 0.1 }}
        className="flex-1 flex flex-col w-full h-full p-4 md:p-8 max-w-5xl mx-auto relative overflow-hidden"
      >
        
        {/* TOP: STATUS & TIMER */}
        <div className="flex flex-col gap-4 z-30">
          <div className="flex justify-between items-center bg-gray-900/60 backdrop-blur-xl p-3 md:p-4 rounded-2xl border border-white/5 shadow-2xl">
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-gray-500 tracking-widest uppercase">STATUS</span>
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${room.status === 'playing' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
                 <span className="text-sm font-black text-white italic uppercase tracking-tighter">
                   {room.status === 'playing' ? 'BATTLE' : room.status.toUpperCase()}
                 </span>
               </div>
             </div>

             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-gray-500 tracking-widest uppercase">TIME</span>
                <span className={`text-2xl md:text-3xl font-black tabular-nums tracking-tighter ${room.timeRemaining <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {room.timeRemaining}s
                </span>
             </div>

             <button 
               onClick={() => {
                 stopAllMusic();
                 onLeave();
               }} 
               className="p-3 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>

          <TugBar score={room.score} playerTeam={team || undefined} />
        </div>

        {/* CENTER: BATTLE ARENA */}
        <div className="flex-1 flex items-center justify-center relative min-h-0">
          <div className="w-full max-w-4xl flex justify-between items-center gap-2 md:gap-12 relative z-10">
             <DogCharacter 
                team="left" 
                volume={leftVolume} 
                label={team === 'left' ? 'BẠN' : 'ĐỐI THỦ'}
                isWinner={room.status === 'finished' && room.winner === 'left'} 
                isLoser={room.status === 'finished' && room.winner === 'right'} 
             />
             
             <div className="flex flex-col items-center gap-4 shrink-0">
                <div className="bg-white text-gray-950 font-black px-4 py-1 md:px-6 md:py-2 rounded-full text-lg md:text-2xl italic tracking-tighter shadow-xl">VS</div>
             </div>

             <DogCharacter 
                team="right" 
                volume={rightVolume} 
                label={team === 'right' ? 'BẠN' : 'ĐỐI THỦ'}
                isWinner={room.status === 'finished' && room.winner === 'right'} 
                isLoser={room.status === 'finished' && room.winner === 'left'} 
             />
          </div>

          <AnimatePresence>
            {room.status === 'countdown' && (
              <motion.div key="countdown" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 3, opacity: 0 }} className="absolute inset-0 flex items-center justify-center text-[clamp(8rem,20vw,15rem)] font-black text-yellow-500 italic drop-shadow-[0_0_50px_rgba(250,204,21,0.8)] z-50 pointer-events-none">
                {room.countdown}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM: CONTROLS & INFO */}
        <div className="flex flex-col gap-4 z-30 pb-4 md:pb-0">
           <AnimatePresence mode="wait">
              {room.status === 'waiting' && (
                 <motion.div key="waiting" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-gray-900/80 backdrop-blur-2xl p-5 md:p-6 rounded-[2rem] border border-white/5 shadow-2xl text-center mx-auto w-full max-w-md">
                   <h2 className="text-sm font-black text-white mb-1 uppercase tracking-widest italic">Đang chờ đối thủ...</h2>
                   <p className="text-[10px] text-gray-500 font-bold mb-5 uppercase tracking-widest">Người chơi: {players.length}/2</p>
                   {!micActive ? (
                     <button onClick={handleReady} className="w-full bg-gradient-to-r from-yellow-400 to-orange-600 text-gray-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all italic">
                       <Mic className="w-5 h-5 fill-gray-950" /> BẬT MIC & SẴN SÀNG
                     </button>
                   ) : (
                     <div className="w-full text-green-500 font-black flex items-center justify-center gap-3 bg-green-500/5 py-4 px-6 rounded-2xl border border-green-500/20 italic">
                       <CheckCircle2 className="w-5 h-5" /> ĐÃ SẴN SÀNG
                     </div>
                   )}
                 </motion.div>
              )}

              {room.status === 'finished' && (
                 <motion.div key="finished" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-950/90 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border-2 border-yellow-500/50 shadow-[0_0_80px_rgba(250,204,21,0.2)] text-center mx-auto w-full max-w-md">
                   <div className="flex items-center justify-center gap-3 mb-6">
                     <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                       {room.winner === 'tie' ? "HÒA!" : room.winner === team ? 'CHIẾN THẮNG' : 'THẤT BẠI'}
                     </h2>
                   </div>
                   <div className="flex gap-3">
                     <button onClick={handleRematch} disabled={rematchRequested} className={`flex-1 font-black py-4 rounded-2xl shadow-xl active:scale-95 text-sm italic ${rematchRequested ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-950'}`}>
                       {rematchRequested ? 'ĐANG CHỜ...' : 'CHƠI LẠI'}
                     </button>
                     <button 
                        onClick={() => {
                          stopAllMusic();
                          onLeave();
                        }} 
                        className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl border border-white/5 text-sm uppercase tracking-widest"
                      >
                        THOÁT
                      </button>
                   </div>
                  </motion.div>
              )}
           </AnimatePresence>
        </div>

           <div className="flex justify-between items-center bg-gray-950/40 backdrop-blur-lg px-5 py-3 rounded-2xl border border-white/5 max-w-xs mx-auto w-full">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">ROOM ID</span>
                <span className="text-lg font-black text-yellow-500 tracking-widest">{roomId}</span>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="relative p-2 text-gray-500 hover:text-white">
                <Copy className="w-4 h-4" />
                {copied && <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: -20 }} exit={{ opacity: 0 }} className="absolute right-0 bg-yellow-500 text-gray-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">COPIED!</motion.span>}
              </button>
           </div>
      </motion.div>
      
      {!audioUnlocked && micActive && (
        <div className="fixed inset-0 z-[200] bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-6">
           <button onClick={handleReady} className="bg-yellow-500 text-gray-950 font-black py-6 px-10 rounded-3xl flex flex-col items-center gap-2 animate-bounce shadow-[0_0_50px_rgba(250,204,21,0.5)]">
             <AlertCircle className="w-8 h-8" /> <span className="text-xl uppercase italic">KÍCH HOẠT ÂM THANH</span>
           </button>
        </div>
      )}
    </Layout>
  );
}

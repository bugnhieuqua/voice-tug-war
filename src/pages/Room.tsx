import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { socket } from "../socket";
import { Layout } from "../components/Layout";
import { DogCharacter } from "../components/DogCharacter";
import { TugBar } from "../components/TugBar";
import { useAudioVolume } from "../hooks/useAudioVolume";
import { Mic, CheckCircle2, LogOut, Copy, Play } from "lucide-react";

// Local audio from public folder
const countdownAudio = new Audio(
  "https://www.soundjay.com/buttons/beep-07.wav",
);
const victoryAudio = new Audio("/win.mp3");
const defeatAudio = new Audio("/thua.mp3");
// const clickAudio = new Audio("/vao.mp3");

export function Room({
  roomId,
  team: propTeam,
  initialState,
  onLeave,
}: {
  roomId: string;
  team: "left" | "right";
  initialState?: any;
  onLeave: () => void;
}) {
  const [room, setRoom] = useState<any>(initialState || null);
  const [team, setTeam] = useState<"left" | "right" | null>(propTeam || null);
  const [micActive, setMicActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const volume = useAudioVolume(micActive && room?.status === "playing");

  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);

  const prevStatusRef = useRef(room?.status);
  const prevCountdownRef = useRef(room?.countdown);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRoomState = useCallback((newState: any) => {
    setRoom(newState);
  }, []);

  const handleRematchPending = useCallback((data: { from: string }) => {
    if (data.from !== socket.id) {
      setOpponentWantsRematch(true);
    }
  }, []);

  const handleRematchStart = useCallback(() => {
    setRematchRequested(false);
    setOpponentWantsRematch(false);
  }, []);

  useEffect(() => {
    // Preload
    victoryAudio.load();
    defeatAudio.load();
    // clickAudio.load();

    if (!initialState) {
      socket.emit("getRoomState", roomId, (res: any) => {
        if (res?.roomState) {
          setRoom(res.roomState);
          if (res.team) setTeam(res.team);
        }
      });
    }

    socket.on("roomState", handleRoomState);
    socket.on("rematch-pending", handleRematchPending);
    socket.on("room-rematch", handleRematchStart);

    return () => {
      socket.off("roomState", handleRoomState);
      socket.off("rematch-pending", handleRematchPending);
      socket.off("room-rematch", handleRematchStart);
      socket.emit("leaveRoom");
      // if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [
    roomId,
    initialState,
    handleRoomState,
    handleRematchPending,
    handleRematchStart,
  ]);

  useEffect(() => {
    if (!room) return;

    if (room.status !== "finished") {
      setRematchRequested(false);
      setOpponentWantsRematch(false);
    }

    if (
      room.status === "countdown" &&
      prevCountdownRef.current !== room.countdown
    ) {
      if (room.countdown > 0) {
        countdownAudio.currentTime = 0;
        countdownAudio.play().catch(() => {});
      }
    }

    if (room.status === "finished" && prevStatusRef.current !== "finished") {
      if (room.winner === team) {
        victoryAudio.currentTime = 0;
        victoryAudio.play().catch(() => {});
      } else if (room.winner !== "tie") {
        defeatAudio.currentTime = 0;
        defeatAudio.play().catch(() => {});
      }
    }

    prevStatusRef.current = room.status;
    prevCountdownRef.current = room.countdown;
  }, [room, team]);

  const playClick = () => {
    /* Tạm tắt logic âm thanh click
    clickAudio.pause();
    clickAudio.currentTime = 0;

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    clickAudio.play().catch(() => {});

    // Stop after 3 seconds
    clickTimeoutRef.current = setTimeout(() => {
      clickAudio.pause();
      clickAudio.currentTime = 0;
    }, 3000);
    */
  };

  const handleReady = () => {
    // playClick(); // Tạm tắt: Nút BẬT MIC & SẴN SÀNG
    // Warm up audio
    victoryAudio
      .play()
      .then(() => {
        victoryAudio.pause();
        victoryAudio.currentTime = 0;
      })
      .catch(() => {});
    defeatAudio
      .play()
      .then(() => {
        defeatAudio.pause();
        defeatAudio.currentTime = 0;
      })
      .catch(() => {});

    setMicActive(true);
    socket.emit("playerReady", roomId);
  };

  const handleRematch = useCallback(() => {
    // playClick(); // Tạm tắt: Nút CHƠI LẠI
    socket.emit("rematch-request", roomId);
    setRematchRequested(true);
  }, [roomId]);

  const handleLeaveClick = () => {
    // playClick(); // Tạm tắt: THOÁT / VỀ TRANG CHỦ
    socket.emit("leaveRoom");
    onLeave();
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (micActive && room?.status === "playing") {
      const interval = setInterval(() => {
        socket.emit("updateForce", roomId, volume);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [micActive, room?.status, roomId, volume]);

  const players = useMemo(
    () => (room ? Object.values(room.players) : []),
    [room],
  );
  const leftPlayer: any = useMemo(
    () => players.find((p: any) => p.team === "left"),
    [players],
  );
  const rightPlayer: any = useMemo(
    () => players.find((p: any) => p.team === "right"),
    [players],
  );
  const leftVolume = useMemo(
    () => (leftPlayer?.id === socket.id ? volume : leftPlayer?.force || 0),
    [leftPlayer, volume],
  );
  const rightVolume = useMemo(
    () => (rightPlayer?.id === socket.id ? volume : rightPlayer?.force || 0),
    [rightPlayer, volume],
  );

  if (!room)
    return (
      <Layout bgImage="https://i.pinimg.com/1200x/f8/bb/c7/f8bbc7bb3b77869d2762d1ede25ebcbf.jpg">
        <div className="flex-1 flex items-center justify-center p-8 text-white text-2xl font-bold animate-pulse">
          Đang vào đấu trường...
        </div>
      </Layout>
    );

  return (
    <Layout bgImage="https://i.pinimg.com/1200x/f8/bb/c7/f8bbc7bb3b77869d2762d1ede25ebcbf.jpg">
      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full relative overflow-hidden h-screen max-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 z-20">
          <button
            onClick={handleLeaveClick}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all font-bold uppercase tracking-widest text-xs"
          >
            <LogOut className="w-4 h-4" />
            THOÁT GAME
          </button>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
              MÃ PHÒNG
            </span>
            <div className="flex items-center gap-3 relative">
              <span className="text-2xl font-black text-yellow-500 tracking-tighter">{roomId}</span>
              <button 
                onClick={copyRoomId}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {copied && (
                  <motion.span 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute -left-20 top-1/2 -translate-y-1/2 bg-yellow-500 text-gray-900 text-[10px] font-black px-2 py-1 rounded-md shadow-lg"
                  >
                    ĐÃ COPY!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tug Bar at top */}
        <div className="mt-8 mb-4 z-20">
          <TugBar score={room.score} />
        </div>

        {/* Arena Body */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="w-full flex justify-between items-center gap-4 relative z-10">
            <DogCharacter
              team="left"
              volume={leftVolume}
              label={team === "left" ? "BẠN" : "NGƯỜI THAM GIA"}
              isWinner={room.status === "finished" && room.winner === "left"}
              isLoser={room.status === "finished" && room.winner === "right"}
            />

            <div className="flex flex-col items-center gap-4">
              <div className="bg-white text-gray-950 font-black px-6 py-2 rounded-full text-2xl italic tracking-tighter shadow-xl">
                VS
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                  THỜI GIAN
                </span>
                <div
                  className={`text-4xl font-black tabular-nums tracking-tighter ${room.timeRemaining <= 5 ? "text-red-500 animate-pulse" : "text-white"}`}
                >
                  {room.timeRemaining}s
                </div>
              </div>
            </div>

            <DogCharacter
              team="right"
              volume={rightVolume}
              label={team === "right" ? "BẠN" : "NGƯỜI THAM GIA"}
              isWinner={room.status === "finished" && room.winner === "right"}
              isLoser={room.status === "finished" && room.winner === "left"}
            />
          </div>

          <AnimatePresence>
            {room.status === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-[12rem] font-black text-yellow-500 italic drop-shadow-[0_0_50px_rgba(250,204,21,0.8)] z-50 pointer-events-none"
              >
                {room.countdown}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Section - Waiting & Results */}
        <div className="h-40 flex items-end justify-center pb-4 z-30">
          <AnimatePresence mode="wait">
            {room.status === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl text-center max-w-sm w-full pointer-events-auto"
              >
                <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tighter italic leading-none">
                  ĐANG CHỜ ĐỐI THỦ
                </h2>
                <p className="text-gray-400 text-xs font-medium mb-4 leading-none">
                  Người chơi: {players.length}/2
                </p>

                {!room.players[socket.id]?.ready ? (
                  <button
                    onClick={handleReady}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-yellow-300 hover:to-orange-500 text-gray-950 font-black py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(250,204,21,0.3)] active:scale-95 transition-all text-sm"
                  >
                    <Mic className="w-5 h-5" />
                    BẬT MIC & SẴN SÀNG
                  </button>
                ) : (
                  <div className="w-full text-green-400 font-black flex items-center justify-center gap-3 bg-green-400/10 py-3 px-6 rounded-2xl border-2 border-green-400/30 italic text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    ĐANG CHỜ...
                  </div>
                )}
              </motion.div>
            )}

            {room.status === "finished" && (
              <motion.div
                key="finished"
                initial={{ scale: 0.5, opacity: 0, y: 100 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-gray-950/95 border-4 border-yellow-500 p-8 rounded-[2.5rem] shadow-[0_0_100px_rgba(250,204,21,0.4)] text-center max-w-md w-full pointer-events-auto backdrop-blur-xl"
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl"
                  >
                    {room.winner === "tie"
                      ? "🤝"
                      : room.winner === team
                        ? "🏆"
                        : "💀"}
                  </motion.div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                    {room.winner === "tie"
                      ? "HÒA!"
                      : room.winner === team
                        ? "CHIẾN THẮNG"
                        : "THẤT BẠI"}
                  </h2>
                </div>

                {opponentWantsRematch && !rematchRequested && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-yellow-500 font-black mb-4 italic animate-pulse text-xs"
                  >
                    ĐỐI THỦ MUỐN CHƠI LẠI!
                  </motion.p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleRematch}
                    disabled={rematchRequested}
                    className={`flex-1 font-black py-3 px-6 rounded-xl transition-all shadow-xl active:scale-95 text-sm flex items-center justify-center gap-2 ${
                      rematchRequested
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-yellow-400 to-orange-600 text-gray-950 hover:from-yellow-300 hover:to-orange-500"
                    }`}
                  >
                    {rematchRequested ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        ĐANG CHỜ...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        CHƠI LẠI
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleLeaveClick}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-3 px-6 rounded-xl transition-all active:scale-95 text-sm border border-white/10"
                  >
                    VỀ TRANG CHỦ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

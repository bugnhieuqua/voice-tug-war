import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layout } from "../components/Layout";
import { socket } from "../socket";
import { Volume2, Play, ChevronRight } from "lucide-react";

const searchingAudio = new Audio("/timdoithu.mp3");
const matchFoundAudio = new Audio("/win.mp3");

const SLIDE_IMAGES = [
  "https://i.pinimg.com/736x/87/42/7f/87427f7142823674686940a08e18f268.jpg",
  "https://i.pinimg.com/736x/f6/8e/4a/f68e4a9e9e1e9e0e9e0e9e0e9e0e9e0e.jpg", // Placeholder, will be corrected if needed
  "https://i.pinimg.com/736x/4d/1e/8a/4d1e8a9e9e1e9e0e9e0e9e0e9e0e9e0e.jpg",
  "https://i.pinimg.com/736x/cow_tug_war_1.jpg",
  "https://i.pinimg.com/736x/cow_tug_war_2.jpg",
  "https://i.pinimg.com/736x/cow_tug_war_3.jpg",
];

const SEARCHING_IMAGES = [
  "https://i.pinimg.com/736x/cow_searching_1.jpg",
  "https://i.pinimg.com/736x/cow_searching_2.jpg",
  "https://i.pinimg.com/736x/cow_searching_3.jpg",
];

export function Home({
  onJoin,
}: {
  onJoin: (roomId: string, team: "left" | "right", roomState?: any) => void;
}) {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(socket.connected);
  const [searching, setSearching] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchSlide, setSearchSlide] = useState(0);

  useEffect(() => {
    searchingAudio.loop = true;
    matchFoundAudio.load();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("queue-status", (data) => {
      setSearching(data.status === "searching");
      if (data.status !== "searching") setLoading(false);
    });

    socket.on("match-found", (data) => {
      setSearching(false);
      setLoading(false);
      onJoin(data.roomId, data.team, data.roomState);
    });

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queue-status");
      socket.off("match-found");
      searchingAudio.pause();
      clearInterval(slideInterval);
    };
  }, [onJoin]);

  // Searching slide timer
  useEffect(() => {
    let interval: any;
    if (searching) {
      interval = setInterval(() => {
        setSearchSlide((prev) => (prev + 1) % SEARCHING_IMAGES.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [searching]);

  useEffect(() => {
    if (searching) {
      searchingAudio.currentTime = 0;
      searchingAudio.play().catch(() => {});
    } else {
      searchingAudio.pause();
    }
  }, [searching]);

  const handleFindMatch = () => {
    if (!socket.connected) {
      setError("Đang kết nối tới máy chủ...");
      return;
    }
    setLoading(true);
    socket.emit("find-match");
    setTimeout(() => {
      if (!searching) setSearching(true);
      setLoading(false);
    }, 500);
  };

  const handleCancelMatch = () => {
    socket.emit("cancel-match");
    setSearching(false);
    setLoading(false);
  };

  const handleCreateRoom = () => {
    if (!socket.connected) {
      setError("Máy chủ đang bận...");
      return;
    }
    setLoading(true);
    socket.emit("createRoom", (res: any) => {
      if (res?.roomId) handleJoinRoom(res.roomId);
      else {
        setLoading(false);
        setError("Lỗi tạo phòng");
      }
    });
  };

  const handleJoinRoom = (code: string) => {
    if (!code) return;
    setLoading(true);
    socket.emit("joinRoom", code, (res: any) => {
      setLoading(false);
      if (res?.error) setError(res.error);
      else if (res?.success) onJoin(code, res.team, res.roomState);
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row h-full w-full bg-[#0a0a0c] overflow-hidden">
        {/* Slider Section */}
        <div className="order-1 md:order-2 flex-1 relative overflow-hidden bg-gray-950 min-h-[35vh] md:min-h-0 shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-gray-950 via-transparent to-transparent z-10" />
              <img
                src={SLIDE_IMAGES[currentSlide]}
                className="w-full h-full object-cover"
                alt="COW WAR Slider"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-6 right-6 z-20 flex gap-2">
            {SLIDE_IMAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${currentSlide === i ? "w-6 bg-yellow-500" : "w-1.5 bg-white/20"}`}
              />
            ))}
          </div>
        </div>

        {/* Menu Section */}
        <div className="order-2 md:order-1 w-full md:w-[420px] lg:w-[480px] flex flex-col p-6 md:p-10 z-20 bg-gray-900/60 backdrop-blur-3xl border-t md:border-t-0 md:border-r border-white/5 shadow-2xl overflow-y-auto custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full my-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 ${connected ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
              >
                <div
                  className={`w-1 h-1 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                {connected ? "LIVE" : "OFFLINE"}
              </div>
            </div>

            <h1 className="text-[clamp(3.5rem,10vw,5rem)] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-400 to-red-600 mb-1 tracking-tighter italic leading-[0.85] drop-shadow-2xl">
              COW
              <br />
              WAR
            </h1>
            <p className="text-gray-400 mb-8 font-black uppercase tracking-[0.2em] text-[10px] italic opacity-80">
              Rống to lên để chiến thắng!
            </p>

            <div className="space-y-4">
              <button
                onClick={handleFindMatch}
                disabled={loading || searching}
                className="group w-full bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-yellow-300 hover:to-orange-500 text-gray-950 font-black py-5 px-6 rounded-2xl flex items-center justify-between gap-3 shadow-[0_10px_30px_rgba(250,204,21,0.2)] active:scale-95 transition-all text-lg italic disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Play
                    className={`w-5 h-5 fill-gray-950 ${loading ? "animate-spin" : ""}`}
                  />
                  <span>{loading ? "ĐANG KẾT NỐI..." : "TÌM TRẬN"}</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleCreateRoom}
                disabled={loading || searching}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 px-6 rounded-2xl border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] disabled:opacity-50"
              >
                TẠO PHÒNG RIÊNG
              </button>

              <div className="flex items-center text-gray-800 gap-3 py-1">
                <div className="flex-1 h-px bg-gray-800/50"></div>
                <span className="text-[9px] font-black tracking-widest opacity-50 uppercase">
                  Hoặc nhập mã
                </span>
                <div className="flex-1 h-px bg-gray-800/50"></div>
              </div>

              <div className="flex items-center bg-gray-950/80 border border-white/5 p-1 rounded-2xl focus-within:border-yellow-500/30 transition-all shadow-inner">
                <input
                  type="text"
                  placeholder="MÃ PHÒNG"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-transparent text-white font-mono font-black tracking-[0.2em] flex-1 px-4 py-3 outline-none placeholder:text-gray-800 uppercase text-sm"
                  maxLength={6}
                />
                <button
                  onClick={() => handleJoinRoom(joinCode)}
                  disabled={loading || !joinCode}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 font-black py-3 px-6 rounded-xl transition-all active:scale-95 italic text-sm"
                >
                  VÀO
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-[10px] font-black bg-red-500/5 p-3 rounded-xl border border-red-500/10 uppercase text-center">
                  {error}
                </p>
              )}
            </div>
          </motion.div>

          <div className="mt-8 pt-8 border-t border-white/5 text-[8px] font-bold text-gray-700 uppercase tracking-[0.4em] text-center md:text-left">
            COW WAR
          </div>
        </div>
      </div>

      <AnimatePresence>
        {searching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center overflow-hidden"
          >
            {/* Background Slider for Searching Overlay */}
            <div className="absolute inset-0 z-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={searchSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0"
                >
                  <img
                    src={SEARCHING_IMAGES[searchSlide]}
                    className="w-full h-full object-cover blur-sm scale-110"
                    alt="Searching Background"
                  />
                  <div className="absolute inset-0 bg-gray-950/80" />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 w-32 h-32 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 border-2 border-yellow-500/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-2 border-2 border-orange-500/40 rounded-full border-t-orange-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Volume2 className="w-10 h-10 text-yellow-500 animate-pulse" />
              </div>
            </div>

            <h2 className="relative z-10 text-4xl font-black text-white mb-2 italic tracking-tighter uppercase drop-shadow-lg">
              TÌM ĐỐI THỦ...
            </h2>
            <p className="relative z-10 text-gray-400 text-[10px] font-bold tracking-[0.5em] mb-12 animate-pulse">
              HÃY SẴN SÀNG ĐỂ GÁY
            </p>

            <button
              onClick={handleCancelMatch}
              className="relative z-10 bg-white/10 hover:bg-red-500/20 hover:text-red-500 text-gray-400 font-black py-4 px-12 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all uppercase text-xs tracking-widest backdrop-blur-md active:scale-95"
            >
              HỦY TÌM KIẾM
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

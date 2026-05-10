import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layout } from "../components/Layout";
import { socket } from "../socket";
import { Volume2, Play, ChevronRight, ChevronLeft } from "lucide-react";

// Local audio from public folder (Commented out as requested previously)
// const clickAudio = new Audio('/vao.mp3');
const searchingAudio = new Audio("/timdoithu.mp3");
const matchFoundAudio = new Audio("/win.mp3");

const SLIDE_IMAGES = [
  "https://i.pinimg.com/736x/a1/c4/53/a1c453858c6155ec438ce57d747e5209.jpg",
  "https://i.pinimg.com/1200x/7b/b4/5f/7bb45f567a122959248cb025c46952ad.jpg",
  "https://i.pinimg.com/736x/56/59/31/56593183178cb837775d8452023fd03e.jpg",
  "https://i.pinimg.com/736x/e0/02/9d/e0029def5b5938258c0ded2ad1e5b5b4.jpg",
  "https://i.pinimg.com/1200x/48/b3/2d/48b32d6d49cd9ef62647829c20368a89.jpg",
  "https://i.pinimg.com/736x/5d/76/fd/5d76fd7108840bcc25e37e2624533a06.jpg",
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
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // searchingAudio.load();
    searchingAudio.loop = true;
    matchFoundAudio.load();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("queue-status", (data) => {
      if (data.status === "searching") setSearching(true);
      else setSearching(false);
    });

    socket.on("match-found", (data) => {
      setSearching(false);
      matchFoundAudio.currentTime = 0;
      matchFoundAudio.play().catch(() => {});
      onJoin(data.roomId, data.team, data.roomState);
    });

    // Auto slide timer
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 4000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queue-status");
      socket.off("match-found");
      searchingAudio.pause();
      clearInterval(slideInterval);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [onJoin]);

  useEffect(() => {
    if (searching) {
      searchingAudio.currentTime = 0;
      searchingAudio.play().catch(() => {});
    } else {
      searchingAudio.pause();
    }
  }, [searching]);

  const playClick = () => {
    /* Tạm tắt toàn bộ logic âm thanh click
    // if (clickAudio) { ... }
    */
  };

  const handleFindMatch = () => {
    playClick(); // Nút: TÌM TRẬN
    if (!socket.connected) {
      setError("Đang kết nối tới server...");
      return;
    }
    socket.emit("find-match");
  };

  const handleCancelMatch = () => {
    playClick(); // Nút: HỦY TÌM KIẾM
    socket.emit("cancel-match");
    setSearching(false);
  };

  const handleCreateRoom = () => {
    playClick(); // Nút: TẠO PHÒNG
    if (!socket.connected) {
      setError("Đang kết nối tới server...");
      return;
    }
    setLoading(true);
    socket.emit("createRoom", (res: any) => {
      if (res?.roomId) {
        handleJoinRoom(res.roomId);
      } else {
        setLoading(false);
        setError("Lỗi khi tạo phòng.");
      }
    });
  };

  const handleJoinRoom = (code: string) => {
    playClick(); // Nút: VÀO
    if (!code) return;
    if (!socket.connected) {
      setError("Đang kết nối tới server...");
      return;
    }
    setLoading(true);
    setError("");
    socket.emit("joinRoom", code, (res: any) => {
      setLoading(false);
      if (res?.error) setError(res.error);
      else if (res?.success) onJoin(code, res.team, res.roomState);
    });
  };

  return (
    <Layout bgImage="">
      <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row bg-[#0a0a0c]">
        {/* Left Side: Game Menu */}
        <div className="w-full md:w-[450px] h-full flex flex-col justify-center p-8 md:p-12 z-20 bg-gray-900/40 backdrop-blur-3xl border-r border-white/5 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full text-center md:text-left"
          >
            <div className="flex justify-center md:justify-start mb-6">
              <div
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${connected ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                {connected ? "MÁY CHỦ ONLINE" : "MÁY CHỦ OFFLINE"}
              </div>
            </div>

            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 mb-2 tracking-tighter italic leading-none drop-shadow-2xl">
              DOG WAR
            </h1>
            <p className="text-gray-400 mb-10 font-bold uppercase tracking-widest text-xs italic">
              Gáy thật to - Kéo thật căng!
            </p>

            <div className="space-y-5">
              <button
                onClick={handleFindMatch}
                disabled={loading || searching}
                className="group w-full bg-gradient-to-r from-yellow-400 to-orange-600 hover:from-yellow-300 hover:to-orange-500 text-gray-950 font-black py-5 px-8 rounded-2xl flex items-center justify-between gap-3 shadow-[0_15px_35px_rgba(250,204,21,0.2)] active:scale-95 transition-all text-xl italic"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-6 h-6 fill-gray-950" />
                  <span>TÌM TRẬN NGAY</span>
                </div>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleCreateRoom}
                disabled={loading || searching}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 px-6 rounded-2xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                TẠO PHÒNG ĐẤU
              </button>

              <div className="flex items-center text-gray-700 gap-4 py-2">
                <div className="flex-1 h-px bg-gray-800"></div>
                <span className="text-[10px] font-black tracking-widest">
                  HOẶC NHẬP MÃ
                </span>
                <div className="flex-1 h-px bg-gray-800"></div>
              </div>

              <div className="flex items-center bg-gray-950/80 border border-white/5 p-1 rounded-2xl focus-within:border-yellow-500/50 transition-all shadow-inner">
                <input
                  type="text"
                  placeholder="MÃ PHÒNG"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-transparent text-white font-mono font-black tracking-widest flex-1 px-4 py-3 outline-none placeholder:text-gray-700 uppercase text-sm"
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
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-[11px] font-black bg-red-400/5 p-3 rounded-xl border border-red-500/20 uppercase tracking-tighter"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>

          <div className="mt-auto pt-8 text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em] text-center md:text-left">
            Bá vô đây mà múc
          </div>
        </div>

        {/* Right Side: Image Slider */}
        <div className="flex-1 relative overflow-hidden bg-gray-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent z-10" />
              <img
                src={SLIDE_IMAGES[currentSlide]}
                className="w-full h-full object-cover"
                alt="Dog War Slider"
              />
            </motion.div>
          </AnimatePresence>

          {/* Slide Navigation Dots */}
          <div className="absolute bottom-10 right-10 z-20 flex gap-3">
            {SLIDE_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 transition-all duration-500 rounded-full ${currentSlide === i ? "w-10 bg-yellow-500" : "w-3 bg-white/20"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Searching Overlay */}
      <AnimatePresence>
        {searching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative w-48 h-48 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-4 border-4 border-orange-500/40 rounded-full border-t-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.3)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Volume2 className="w-16 h-16 text-yellow-500 animate-pulse" />
              </div>
            </div>

            <h2 className="text-5xl font-black text-white mb-2 italic tracking-tighter uppercase">
              ĐANG TÌM ĐỐI THỦ...
            </h2>
            <p className="text-gray-400 font-bold mb-12 tracking-widest text-xs">
              HÃY SẴN SÀNG ĐỂ GÁY!
            </p>

            <button
              onClick={handleCancelMatch}
              className="bg-white/5 hover:bg-red-500/10 text-white hover:text-red-500 border border-white/10 hover:border-red-500/30 font-black py-4 px-12 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm"
            >
              HỦY TÌM KIẾM
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

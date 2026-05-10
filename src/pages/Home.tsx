import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Layout } from '../components/Layout';
import { socket } from '../socket';
import { Volume2 } from 'lucide-react';

export function Home({ onJoin }: { onJoin: (roomId: string, team: 'left' | 'right', roomState?: any) => void }) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleCreateRoom = () => {
    if (!socket.connected) {
      setError('Đang kết nối tới server... Hãy thử lại trong vài giây.');
      return;
    }
    setLoading(true);
    socket.emit('createRoom', (res: any) => {
      if (res?.roomId) {
        handleJoinRoom(res.roomId);
      } else {
        setLoading(false);
        setError('Lỗi khi tạo phòng.');
      }
    });

    // Timeout fallback just in case
    setTimeout(() => {
      setLoading(false);
    }, 5000);
  };

  const handleJoinRoom = (code: string) => {
    if (!code) return;
    if (!socket.connected) {
      setError('Đang kết nối tới server... Hãy thử lại trong vài giây.');
      return;
    }
    setLoading(true);
    setError('');
    socket.emit('joinRoom', code, (res: any) => {
      setLoading(false);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        onJoin(code, res.team, res.roomState);
      } else {
        setError('Lỗi khi tham gia phòng.');
      }
    });
    
    // Timeout fallback
    setTimeout(() => {
      setLoading(false);
    }, 5000);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md text-center"
        >
          {/* Connection Status Indicator */}
          {!connected && (
            <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full font-mono border border-red-500/40 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Disconnected
            </div>
          )}
          {connected && (
            <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-mono border border-green-500/40 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Connected
            </div>
          )}

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.5)]">
              <Volume2 className="w-10 h-10 text-gray-900" />
            </div>
          </div>
          
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-2 font-black tracking-tighter italic">
            DOG WAR
          </h1>
          <p className="text-gray-400 mb-8 font-medium">Yell to pull the rope! Real-time multiplayer.</p>
          
          <div className="space-y-6">
            <button 
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-xl transition cursor-pointer flex items-center justify-center gap-2">
                CREATE ROOM
              </div>
            </button>

            <div className="flex items-center text-gray-500 gap-4">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-sm font-bold tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            <div className="bg-gray-800/50 p-2 rounded-xl border border-gray-700 flex">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="bg-transparent text-white font-mono font-bold tracking-widest flex-1 px-4 outline-none placeholder:text-gray-600 text-center uppercase"
                maxLength={6}
              />
              <button 
                onClick={() => handleJoinRoom(joinCode)}
                disabled={loading || !joinCode}
                className="bg-white text-gray-900 hover:bg-gray-200 font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                JOIN
              </button>
            </div>
            
            {error && (
              <p className="text-red-400 text-sm font-bold bg-red-400/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

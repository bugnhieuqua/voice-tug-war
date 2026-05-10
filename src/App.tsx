import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { socket } from './socket';

export default function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [team, setTeam] = useState<'left' | 'right' | null>(null);
  const [initialRoomState, setInitialRoomState] = useState<any>(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setCurrentRoom(null);
      setTeam(null);
      setInitialRoomState(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const handleJoin = (roomId: string, assignedTeam: 'left' | 'right', roomState?: any) => {
    console.log('[App] handleJoin called:', { roomId, assignedTeam, hasState: !!roomState });
    setInitialRoomState(roomState || null);
    setCurrentRoom(roomId);
    setTeam(assignedTeam);
  };

  const handleLeave = () => {
    setCurrentRoom(null);
    setTeam(null);
    setInitialRoomState(null);
  };

  return (
    <>
      {currentRoom && team ? (
        <Room roomId={currentRoom} team={team} onLeave={handleLeave} initialState={initialRoomState} />
      ) : (
        <Home onJoin={handleJoin} />
      )}
    </>
  );
}

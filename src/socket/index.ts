import { io } from 'socket.io-client';

// Use the current origin or fallback for AI Studio
export const socket = io(window.location.origin, {
  autoConnect: true,
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err);
});
socket.on('connect', () => {
  console.log('Socket connected successfully:', socket.id);
});

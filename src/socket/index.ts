import { io } from 'socket.io-client';

// In production, connect to the specific backend URL if provided, otherwise fallback to current origin
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'], // Ensure websocket is preferred
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err);
});
socket.on('connect', () => {
  console.log('Socket connected successfully:', socket.id);
});

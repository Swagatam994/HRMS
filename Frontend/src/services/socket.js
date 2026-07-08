import { io } from 'socket.io-client';
import { storageKeys } from '../utils/constants.js';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

let socket;

export const getSocket = () => {
  const token = localStorage.getItem(storageKeys.token);

  if (!token) return null;

  if (!socket || socket.auth?.token !== token) {
    socket?.disconnect();
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

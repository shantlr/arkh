import { Server } from 'socket.io';
import { setupClientSocket, setupClientSubscription } from './client';
import { setupRunnerSocket } from './runner';

export const createSocketServer = async (httpServer) => {
  const io = new Server(httpServer, {
    path: '/socket',
    cors: {
      origin: '*',
    },
  });
  await setupClientSubscription({ io });

  // Client socket
  io.on('connection', (socket) => {
    console.log(socket.id, 'client connected');
    setupClientSocket({ io, socket });
  });

  // Runner
  io.of('runner').on('connection', (socket) => {
    console.log(socket.id, 'runner connected');
    setupRunnerSocket(socket);
  });

  return { io };
};

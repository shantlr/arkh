import { API } from 'api';
import React, { useContext, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = React.createContext();

// const SocketState = React.createContext();

export const SocketProvider = ({ children }) => {
  const [socket] = useState(() => {
    return io(API.socketUrl, {
      path: '/socket',
    });
  });
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

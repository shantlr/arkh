import { API } from 'api';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = React.createContext();

export const SocketProvider = ({ children }) => {
  const [socket] = useState(() => {
    return io(API.socketUrl, {
      path: '/socket',
    });
  });

  // useEffect(() => {
  //   // socket.on('connected', () => {
  //   // })
  // }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
export const useSocket = () => {
  return useContext(SocketContext);
};

const SocketListenerContext = React.createContext();
export const SocketGlobalListenerProvider = ({ children }) => {
  const socket = useSocket();
  const internalStateRef = useRef({
    subscriptions: new Map(),
  });

  const subscribe = useMemo(() => {
    return {
      listen(key, listener) {
        // if (!internalStateRef.current.subscriptions.has(key)) {
        //   internalStateRef.current.subscriptions.set({

        //   })
        // }
        return () => {};
      },
    };
  }, []);

  return (
    <SocketListenerContext.Provider value={subscribe}>
      {children}
    </SocketListenerContext.Provider>
  );
};

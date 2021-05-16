import { API } from 'api';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = React.createContext();

export const SocketProvider = ({ children }) => {
  const [socket] = useState(() => {
    return io(API.socketUrl, {
      path: '/socket',
    });
  });

  useEffect(() => {
    socket.on('connect', () => {
      console.log('socket connected');
    });
    socket.on('disconnect', (reason) => {
      console.log('socket disconnect', reason);
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          socket.connect();
        }, 3000);
      }
    });
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

/**
 * @returns {Socket}
 */
export const useSocket = () => {
  return useContext(SocketContext);
};

const SocketListenerContext = React.createContext();
export const SocketGlobalListenerProvider = ({ children }) => {
  const socket = useSocket();
  const internalStateRef = useRef({
    /**
     * @type {Map<
     *  string,
     *  {
     *    listeners: Map<any, {
     *      callback: (input: any) => void,
     *      cleanup?: () => void,
     *      count: number
     *    }>,
     *    socketListener: () => void
     *  }
     * >}
     */
    subscriptions: new Map(),
  });

  const subscribe = useMemo(() => {
    const getSubscription = (key) => {
      if (!internalStateRef.current.subscriptions.has(key)) {
        internalStateRef.current.subscriptions.set(key, {
          listeners: new Map(),
          listeningSocket: false,
        });
      }
      return internalStateRef.current.subscriptions.get(key);
    };

    return {
      listen(
        key,
        listener,
        { listenerKey = listener, init = null, cleanup = null }
      ) {
        const subscription = getSubscription(key);

        if (!subscription.listeners.has(listenerKey)) {
          if (typeof init === 'function') {
            init({ socket });
          }

          subscription.listeners.set(listenerKey, {
            callback: listener,
            count: 1,
            cleanup,
          });
        } else {
          subscription.listeners.get(listenerKey).count += 1;
        }

        if (!subscription.socketListener) {
          subscription.socketListener = (event) => {
            subscription.listeners.forEach((listener) => {
              listener.callback(event, { socket });
            });
          };
          socket.on(key, subscription.socketListener);
        }

        return () => {
          const l = subscription.listeners.get(listenerKey);
          l.count -= 1;
          if (l.count <= 0) {
            subscription.listeners.delete(listenerKey);
            if (typeof l.cleanup === 'function') {
              l.cleanup({ socket });
            }
          }
        };
      },
    };
  }, [socket]);

  // Cleanup listeners
  useEffect(() => {
    const subData = internalStateRef.current;
    return () => {
      subData.subscriptions.forEach((subscription, key) => {
        socket.off(key, subscription.socketListener);
        subscription.listeners.forEach((l) => {
          if (typeof l.cleanup === 'function') {
            l.cleanup({ socket });
          }
        });
      });
    };
  }, [socket]);

  return (
    <SocketListenerContext.Provider value={subscribe}>
      {children}
    </SocketListenerContext.Provider>
  );
};

/**
 * return socket subscription object
 */
export const useSocketSubscription = () => useContext(SocketListenerContext);

/**
 * Ensure only one global subscription is active for given key
 * @param {Object} input
 * @param {string} input.key
 * @param {(input: { socket: Socket }) => void} [input.init]
 * @param {(event: any) => void} input.listener
 * @param {(input: { socket: Socket }) => void} [input.cleanup]
 */
export const useGlobalSocketSubscription = ({
  key,
  init,
  listener,
  cleanup,
}) => {
  const subscription = useSocketSubscription();

  useEffect(() => {
    subscription.listen(key, listener, {
      listenerKey: '@global',
      init,
      cleanup,
    });
  }, [subscription]); // eslint-disable-line react-hooks/exhaustive-deps

  return subscription;
};

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  SocketIOClientToServerEvents,
  SocketIOServerToClientEvents,
} from '@arkh/types';
import { Socket } from 'socket.io-client';

import { useEqualMemo } from 'lib/hooks';

type TypedSocket = Socket<
  SocketIOServerToClientEvents,
  SocketIOClientToServerEvents
>;

const Context = createContext<TypedSocket | null>(null);

const SubscriptionContext = createContext<{
  incrementSubscribedCount(key: string): number;
  decrementSubscribedCount(key: string): number;
  setReconnectHandler(key: string, callback: () => void): void;
  getReconnectHandler(key: string): (() => void) | undefined;
  delete(key: string): void;
} | null>(null);

const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const ref = useRef<
    Record<
      string,
      {
        count: number;
        reconnectHandler?: () => void;
      }
    >
  >({});
  const [value] = useState(() => ({
    incrementSubscribedCount(key: string) {
      if (!ref.current[key]) {
        ref.current[key] = { count: 0 };
      }
      ref.current[key].count += 1;
      return ref.current[key].count;
    },
    decrementSubscribedCount(key: string) {
      if (!ref.current[key]) {
        return -1;
      }
      if (ref.current[key]) {
        ref.current[key].count -= 1;
      }
      return ref.current[key].count;
    },
    setReconnectHandler(key: string, callback: () => void) {
      if (!ref.current[key]) {
        throw new Error(`No subscribed for '${key}'`);
      }
      ref.current[key].reconnectHandler = callback;
    },
    getReconnectHandler(key: string) {
      return ref.current[key].reconnectHandler;
    },
    delete(key: string) {
      if (ref.current[key]) {
        if (ref.current[key].count) {
          throw new Error(`There are still subscribed for '${key}'`);
        }
        delete ref.current[key];
      }
    },
  }));

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const SocketProvider = ({
  socket,
  children,
}: {
  socket: Socket;
  children: ReactNode;
}) => {
  return (
    <Context.Provider value={socket}>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </Context.Provider>
  );
};

export const useSocket = () => useContext(Context);
const useSubscriptionContext = () => useContext(SubscriptionContext);

// export const useSocketEmit = (name: string, args: any) => {
//   const socket = useSocket();

//   useEffect(() => {
//     if (!socket) {
//       return;
//     }

//     socket.emit(name, args);
//   }, [socket, name, args]);
// };
export function useSocketListen<
  EventName extends keyof SocketIOServerToClientEvents,
  Callback extends SocketIOServerToClientEvents[EventName] = SocketIOServerToClientEvents[EventName]
>(name: EventName, callback: Callback) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }
    // @ts-ignore
    socket.on(name, callback);

    return () => {
      // @ts-ignore
      socket.removeListener(name, callback);
    };
  });
}

export function createUseSubscribe<T = void>({
  key,
  subscribe,
  unsubscribe,
}: {
  key: string | ((param: T) => string);
  subscribe: (socket: TypedSocket, param: T) => void;
  unsubscribe: (socket: TypedSocket, param: T) => void;
}) {
  return (param: T) => {
    const socket = useSocket();
    const sub = useSubscriptionContext();

    const memoParam = useEqualMemo(param);

    useEffect(() => {
      if (!socket || !sub) {
        return;
      }
      const k = typeof key === 'string' ? key : key(memoParam);

      if (sub.incrementSubscribedCount(k) === 1) {
        const reconnectHandler = () => {
          subscribe(socket, memoParam);
        };
        if (socket.connected) {
          reconnectHandler();
        }
        sub.setReconnectHandler(k, reconnectHandler);
        socket.on('connect', reconnectHandler);
      }

      return () => {
        if (!sub.decrementSubscribedCount(k)) {
          const reconnectHandler = sub.getReconnectHandler(k);
          if (reconnectHandler) {
            socket.removeListener('connect', reconnectHandler);
          }
          sub.delete(k);
          // if subscribed counter reach 0 => unsub
          unsubscribe(socket, memoParam);
        }
      };
    }, [memoParam, socket, sub]);
  };
}

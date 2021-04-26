import { useSocket } from 'containers/socket';
import { useEffect, useReducer } from 'react';

const logsReducer = (state = [], action) => {
  return [...state, ...action];
};

export const useCommandLogs = (commandName) => {
  const [logs, dispatch] = useReducer(logsReducer);
  const socket = useSocket();

  useEffect(() => {
    const listener = (data) => {
      dispatch(data);
    };
    socket.on(`command-logs:${commandName}`, listener);

    socket.emit('listen-command-logs', {
      name: commandName,
    });
    return () => {
      socket.off(`command-logs:${commandName}`);
      socket.emit(`stop-listen-command-logs`, {
        name: commandName,
      });
    };
  }, [socket, commandName]);
  return logs;
};

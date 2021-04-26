import { useSocket } from 'containers/socket';
import { useEffect, useReducer } from 'react';

const logsReducer = (state = [], action) => {
  if (!action || !action.length) {
    return state;
  }

  if (state.length) {
    const end = state[state.length - 1];
    if (action[0].offset <= end.offset) {
      return state;
    }
  }
  return [...state, ...action];
};

export const useCommandLogs = (commandName) => {
  const [logs, dispatch] = useReducer(logsReducer);
  const socket = useSocket();

  useEffect(() => {
    const listener = (data) => {
      console.log('data', data);
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

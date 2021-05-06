import { useSocket } from 'containers/socket';
import { useEffect, useReducer } from 'react';
import { useQueryClient } from 'react-query';

const MAX_LOGS = 5000;

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
  const res = [...state, ...action];
  if (res.length > MAX_LOGS) {
    res.splice(0, res.length - MAX_LOGS);
  }
  return res;
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
      socket.off(`command-logs:${commandName}`, listener);
      socket.emit(`stop-listen-command-logs`, {
        name: commandName,
      });
    };
  }, [socket, commandName]);
  return logs;
};

export const useSubscribeCommandState = (commandName) => {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const listener = (newState) => {
      queryClient.setQueryData(['command', commandName], (old) => {
        if (old) {
          return {
            ...old,
            state: newState,
          };
        }
        return old;
      });
    };
    socket.on(`command-state:${commandName}`, listener);
    socket.emit('listen-command-state', {
      name: commandName,
    });

    return () => {
      console.log('LEAVE');
      socket.off(`command-state:${commandName}`, listener);
      socket.emit(`stop-listen-command-state`, {
        name: commandName,
      });
    };
  }, [socket, commandName, queryClient]);
};

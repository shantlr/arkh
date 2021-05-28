import { useGlobalSocketSubscription, useSocket } from 'containers/socket';
import { useCacheAccessor } from 'lib/cache';
import { useEffect, useReducer } from 'react';

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

export const useSubscribeCommands = () => {
  const dataCache = useCacheAccessor();

  useGlobalSocketSubscription({
    key: 'publish-command',
    init: ({ socket }) => {
      socket.emit('subscribe-commands');
    },
    listener: (event) => {
      if (event.type === 'created' || event.type === 'deleted') {
        dataCache.invalidateQuery('commands');
      }
      dataCache.updateKey('command', event.command.id, event.command);
    },
    cleanup: ({ socket }) => {
      socket.emit('unsubscribe-commands');
    },
  });
};

export const useSubscribeRunnerAvailable = () => {
  const dataCache = useCacheAccessor();

  useGlobalSocketSubscription({
    key: 'publish-runner-available',
    init: ({ socket }) => {
      socket.emit('subscribe-runner-available');
    },
    listener: (event) => {
      dataCache.updateKey('runner-available', null, event);
    },
    cleanup: ({ socket }) => {
      socket.emit('unsubscribe-runner-available');
    },
  });
};

export const useSubscribeCommandTask = (commandId) => {
  const dataCache = useCacheAccessor();

  useGlobalSocketSubscription({
    key: `publish-command-task:${commandId}`,
    init: ({ socket }) => {
      socket.emit('subscribe-command-tasks', { commandId });
    },
    listener: (event) => {
      dataCache.dispatch('command-task', event);
    },
    cleanup: ({ socket }) => {
      socket.emit('unsubscribe-command-tasks', { commandId });
    },
  });
};

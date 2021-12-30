import { API } from 'configs';
import { createUseSubscribe, useSocketListen } from 'lib/context/socket';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { QUERY_KEY } from './key';

export const useStack = (stackName: string) =>
  useQuery(
    QUERY_KEY.stack.detail(stackName),
    () => API.stack.get(stackName as string),
    {
      enabled: Boolean(stackName),
    }
  );

export const useStackTabs = (stackName: string) =>
  useQuery(
    QUERY_KEY.stack.tabs(stackName),
    () => API.stack.getTabs(stackName),
    {
      enabled: Boolean(stackName),
    }
  );

export const useSubStacks = createUseSubscribe({
  key: 'subscribe-stacks',
  subscribe(socket) {
    socket.emit('subscribe-stacks');
  },
  unsubscribe(socket) {
    socket.emit('unsubscribe-stacks');
  },
});

export const useSubscribeStacks = () => {
  const queryClient = useQueryClient();
  useSubStacks();
  useSocketListen(
    'stack-event',
    useCallback(
      (event) => {
        console.log('event', event);
        queryClient.invalidateQueries('stacks');
        queryClient.invalidateQueries('stack');
      },
      [queryClient]
    )
  );
};

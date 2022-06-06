import { useCallback } from 'react';

import { StackTab } from '@shantlr/shipyard-common-types';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { API } from 'configs';
import { createUseSubscribe, useSocketListen } from 'lib/context/socket';

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

const formatTabSlug = (name: string) => name.replace(/[ ]+/, '-').toLowerCase();
export const useRenameStackTab = (stackName: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation(
    ({ oldName, newName }: { oldName: string; newName: string }) =>
      API.stack.renameTab(stackName, oldName, newName),
    {
      onMutate({ oldName, newName }) {
        const newSlug = formatTabSlug(newName);
        queryClient.setQueryData(QUERY_KEY.stack.tabs(stackName), (data) => {
          if (!data) {
            return data;
          }

          return (data as StackTab[]).map((tab) => {
            if (tab.name === oldName) {
              return {
                ...tab,
                name: newName,
                slug: newSlug,
              };
            }
            return tab;
          });
        });
        navigate(`t/${newSlug}`);
      },
    }
  );
};
export const useDeleteStackTab = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ stackName, tabName }: { stackName: string; tabName: string }) =>
      API.stack.deleteTab(stackName, tabName),
    {
      onMutate({ stackName, tabName }) {
        queryClient.setQueryData(QUERY_KEY.stack.tabs(stackName), (data) => {
          if (!data) {
            return data;
          }
          return (data as StackTab[]).filter((tab) => {
            return tab.name !== tabName;
          });
        });
      },
      onSuccess(d, { stackName }) {
        queryClient.invalidateQueries(QUERY_KEY.stack.tabs(stackName));
      },
    }
  );
};
export const useCreateStackTab = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation(
    ({ stackName, tabName }: { stackName: string; tabName: string }) =>
      API.stack.tab.create(stackName, tabName),
    {
      onMutate({ stackName, tabName }) {
        const slug = formatTabSlug(tabName);
        queryClient.setQueryData<StackTab[]>(
          QUERY_KEY.stack.tabs(stackName),
          (data) => {
            if (!data) {
              return [];
            }
            if (data.find((t) => t.name === tabName)) {
              return data;
            }
            return [
              ...data,
              {
                name: tabName,
                slug,
                keys: {},
              },
            ];
          }
        );

        navigate(`t/${slug}`);
      },
      onSuccess(d, { stackName }) {
        queryClient.invalidateQueries(QUERY_KEY.stack.tabs(stackName));
      },
    }
  );
};
export const useUpdateStackTab = (stackName: string) => {
  const queryClient = useQueryClient();
  return useMutation((tab: StackTab) => API.stack.updateTab(stackName, tab), {
    onSuccess() {
      queryClient.invalidateQueries(QUERY_KEY.stack.tabs(stackName));
    },
  });
};

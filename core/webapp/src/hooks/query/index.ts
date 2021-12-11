import { API } from 'configs';
import { createUseSubscribe, useSocketListen } from 'lib/context/socket';
import { useQuery, useQueryClient } from 'react-query';

const QUERY_KEY = {
  stack: {
    serviceStates: (stackName: string) => [`stack-service-states`, stackName],
  },
};

export const useStackServiceStates = (stackName: string) => {
  return useQuery(QUERY_KEY.stack.serviceStates(stackName), () =>
    API.stack.serviceStates({
      name: stackName,
    })
  );
};

const useSubServiceStates = createUseSubscribe<string>({
  key: (stackName) => `subscribe-stack-service-states:${stackName}`,
  subscribe(socket, stackName) {
    socket.emit(`subscribe-stack-service-states`, stackName);
  },
  unsubscribe(socket, stackName) {
    socket.emit(`unsubscribe-stack-service-states`, stackName);
  },
});
export const useSubscribeServiceStates = (stackName: string) => {
  const queryClient = useQueryClient();
  useSubServiceStates(stackName);
  useSocketListen(
    `update-stack-service-state:${stackName}`,
    (event: {
      stackName: string;
      serviceName: string;
      fullName: string;
      state: any;
    }) => {
      // update cache
      queryClient.setQueryData(
        QUERY_KEY.stack.serviceStates(stackName),
        (prev: any) => {
          return {
            ...(prev || null),
            [event.serviceName]: event.state,
          };
        }
      );
    }
  );
};

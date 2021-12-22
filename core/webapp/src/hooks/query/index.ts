import { API } from 'configs';
import { createUseSubscribe, useSocketListen } from 'lib/context/socket';
import { useQuery, useQueryClient } from 'react-query';

const QUERY_KEY = {
  stack: {
    serviceStates: (stackName: string) => [`stack-service-states`, stackName],
  },
  service: {
    state: (serviceName: string) => ['service', serviceName],
    tasks: (serviceName: string) => ['service', serviceName, 'tasks'],
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
  key: (stackName) => `subscribe-service-states:${stackName}`,
  subscribe(socket, stackName) {
    socket.emit(`subscribe-service-states`, stackName);
  },
  unsubscribe(socket, stackName) {
    socket.emit(`unsubscribe-service-states`, stackName);
  },
});
export const useSubscribeServiceStates = (stackName: string) => {
  const queryClient = useQueryClient();
  useSubServiceStates(stackName);
  useSocketListen(`update-service-state:${stackName}`, (event) => {
    // Add service to cache
    queryClient.setQueryData(
      QUERY_KEY.stack.serviceStates(stackName),
      (prev: any) => {
        return {
          ...(prev || null),
          [event.serviceKey]: event.state,
        };
      }
    );
  });
};

export const useService = (serviceName: string) => {
  return useQuery(QUERY_KEY.service.state(serviceName), () =>
    API.service.get(serviceName)
  );
};
export const useServiceTasks = (serviceName: string) =>
  useQuery(QUERY_KEY.service.tasks(serviceName), () =>
    API.service.task.list(serviceName)
  );
export const useServiceTaskLogs = (taskId: string | null | undefined) =>
  useQuery(
    ['task', taskId, 'logs'],
    () => (taskId ? API.service.task.logs(taskId) : null),
    {
      enabled: Boolean(taskId),
    }
  );

const useSubServiceTasks = createUseSubscribe<string>({
  key: (fullName: string) => `subscribe-stack-service-tasks:${fullName}`,
  subscribe(socket, fullName) {
    socket.emit(`subscribe-service-tasks`, fullName);
  },
  unsubscribe(socket, fullName) {
    socket.emit(`unsubscribe-service-tasks`, fullName);
  },
});
export const useSubscribeServiceTasks = (serviceName: string) => {
  const queryClient = useQueryClient();
  useSubServiceTasks(serviceName);
  useSocketListen(`service-task:${serviceName}`, (event) => {
    if (event.type === 'add-task') {
      // Add task to state if not found
      queryClient.setQueryData(
        QUERY_KEY.service.tasks(serviceName),
        (prev: any = []) => {
          if (!prev.find((p: { id: string }) => p.id === event.task.id)) {
            return [event.task, ...prev];
          }
          return prev;
        }
      );
    } else if (event.type === 'update-task') {
      // Update cache task state
      queryClient.setQueryData(
        QUERY_KEY.service.tasks(serviceName),
        (prev: any = []) => {
          const idx = prev.findIndex(
            (p: { id: string }) => p.id === event.taskStateUpdate.id
          );
          if (idx === -1) {
            return prev;
          }
          const next = [...prev];
          next[idx] = {
            ...prev[idx],
            ...event.taskStateUpdate,
          };
          return next;
        }
      );
    }
  });
};

export const useScubscribeServiceTaskLogs = () => {
  //
};

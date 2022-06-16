export const QUERY_KEY = {
  stack: {
    detail: (stackName: string) => ['stack', stackName],
    serviceStates: (stackName: string) => [
      `stack`,
      stackName,
      'service-states',
    ],
    tabs: (stackName: string) => ['stack', stackName, 'tabs'],
  },
  service: {
    state: (serviceName: string) => ['service', serviceName],
    tasks: (serviceName: string) => ['service', serviceName, 'tasks'],
  },
  task: {
    logs: (taskId: string) => ['task', taskId, 'logs'],
  },
};

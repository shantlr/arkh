import { Subscriptions } from '@shantr/metro-common-types';
import { forEach } from 'lodash';

export const SUBCRIBE_PREFIX = 'subscribe';
export const UNSUBSCRIBE_PREFIX = 'unsubscribe';

export const SUBSCRIPTIONS: Subscriptions = {
  stacks: 'stacks',
  serviceStates: {
    key: 'service-states',
    params: (stackName: string) => stackName,
  },
  serviceTasks: {
    key: 'service-tasks',
    params: (serviceName: string) => serviceName,
  },
  taskLogs: {
    key: 'task-logs',
    params: (taskId: string) => taskId,
  },
};

const mapSubsToRoom = <
  T extends {
    [k: string]:
      | string
      | {
          key: string;
          params: (...args: any[]) => string;
        };
  },
  Key extends keyof T = keyof T
>(
  subs: T
) => {
  // @ts-ignore
  const res: {
    [k in Key]: T[k] extends {
      key: string;
      params: (...args: infer Args) => string;
    }
      ? (...args: Args) => string
      : string;
  } = {};

  forEach(subs, (sub, key) => {
    if (typeof sub === 'string') {
      res[key] = `subscribed-${sub}`;
    } else {
      res[key] = (...args: any[]) =>
        `subscribed-${sub.key}:${sub.params(...args)}`;
    }
  });

  return res;
};

export const ROOMS = {
  subscription: mapSubsToRoom(SUBSCRIPTIONS),
};

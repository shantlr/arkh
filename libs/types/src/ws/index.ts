import { ServiceState, Task, TaskLog } from '../types';

/**
 * Subscription that require parameters
 */
type ParametricSubscription<
  EventName extends string,
  ResolveArgs extends any[]
> = {
  key: EventName;
  params: (...args: ResolveArgs) => string;
};

/**
 * Subscription list definition
 */
export type Subscriptions = {
  stacks: 'stacks';
  serviceStates: ParametricSubscription<'service-states', [string]>;
  serviceTasks: ParametricSubscription<'service-tasks', [string]>;
  taskLogs: ParametricSubscription<'task-logs', [string]>;
};

/**
 * Type that resolve subscribe event name
 */
export type SubscribeEventName<BaseKey extends string> = `subscribe-${BaseKey}`;
/**
 * Type that resolve unsubscribe event name from subscription key
 */
export type UnSubscribeEventName<BaseKey extends string> =
  `unsubscribe-${BaseKey}`;

// export type Rooms = {
// };

/**
 * Map Subscription to SocketIO Events map
 */
/**
 * Extract subscriptions event names
 */
type ExtractSubEventNames<
  Sub extends Subscriptions,
  Key extends keyof Sub
> = Sub[Key] extends ParametricSubscription<infer U, any>
  ? U extends string
    ? `subscribe-${U}` | `unsubscribe-${U}`
    : never
  : Sub[Key] extends string
  ? `subscribe-${Sub[Key]}` | `unsubscribe-${Sub[Key]}`
  : never;

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R
) => any
  ? R
  : never;

type MapSubscriptionToEvents<
  Sub extends Subscriptions,
  SubKeys extends keyof Sub = keyof Sub
> = UnionToIntersection<
  SubKeys extends infer K
    ? K extends keyof Sub
      ? {
          [k in ExtractSubEventNames<
            Sub,
            K
          >]: Sub[K] extends ParametricSubscription<any, infer Args>
            ? (...args: Args) => void
            : () => void;
        }
      : never
    : never
>;

type PatternEvents<
  Prefix extends string,
  EventType extends (...args: any[]) => void,
  Suffix extends string = string
> = {
  [key in `${Prefix}:${Suffix}`]: EventType;
};

export type SocketIOClientToServerEvents =
  MapSubscriptionToEvents<Subscriptions> & {};

export type SocketIOServerToClientEvents = {
  'stack-event': (
    stackEvent:
      | {
          type: 'add-stack';
          name: string;
        }
      | {
          type: 'remove-stack';
          name: string;
        }
      | {
          type: 'update-stack';
          name: string;
        }
  ) => void;
} & PatternEvents<
  'update-service-state',
  (serviceState: {
    serviceName: string;
    serviceKey: string;
    stackName: string;
    state: ServiceState;
  }) => void
> &
  PatternEvents<
    'service-task',
    (
      taskEvent:
        | {
            type: 'add-task';
            task: Task;
          }
        | {
            type: 'update-task';
            taskStateUpdate: {
              id: string;
              running_at?: Date;
              stopping_at?: Date;
              stopped_at?: Date;
              exited_at?: Date;
              exit_code?: number;
            };
          }
    ) => void
  > &
  PatternEvents<'task-log', (log: TaskLog) => void>;

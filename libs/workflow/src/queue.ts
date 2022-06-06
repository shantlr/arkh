import { isPromise } from './utils';

export class ErrorQueueDraining extends Error {}
export class ErrorQueueEnded extends Error {}

const IS_END_ACTION = Symbol('queue.action.end');

export type QueueAction<Data, Ret = void> = {
  data: Data;
  onDone?: (err: any, result?: Awaited<Ret>) => void;
  onCancelled?: () => void;

  [IS_END_ACTION]?: boolean;
};

export type QueueApi<Action extends QueueAction<any, any>> = {
  addAction(action: Action): void;
};

export const defaultOnDone = (err: any) => {
  if (err) {
    throw err;
  }
};

export function createQueue<Action extends QueueAction<any, any>>({
  handleAction,
}: {
  handleAction: (action: Action['data']) => void | Promise<void>;
}) {
  let isEnded = false;
  let isDraining = false;
  let isOngoing = false;

  let actionQueue: Action[] = [];

  const queueApi: QueueApi<Action> = {
    addAction(action) {
      if (isEnded) {
        throw new ErrorQueueEnded();
      }
      if (isDraining) {
        throw new ErrorQueueDraining();
      }

      actionQueue.push(action);
      setImmediate(runAction);
    },
  };

  let ongoingAction: Action = null;
  const runAction = () => {
    if (isEnded || isOngoing || !actionQueue.length) {
      return;
    }
    isOngoing = true;
    const action = actionQueue.shift();
    ongoingAction = action;

    const onDone = action.onDone || defaultOnDone;

    const onFinally = (err: any, res?: any) => {
      isOngoing = false;
      ongoingAction = null;

      // if action is an end action => mark queue as ended
      if (action[IS_END_ACTION]) {
        isEnded = true;
      }

      // NOTE: onDone should be called before runAction
      onDone(err, res);

      // process next action
      runAction();
    };

    let actionRes: any;
    try {
      actionRes = handleAction(action.data);
    } catch (err) {
      onFinally(err);
      return;
    }

    if (isPromise(actionRes)) {
      actionRes
        .then((res) => {
          onFinally(null, res);
        })
        .catch((err) => {
          onFinally(err);
        });
    } else {
      onFinally(null, actionRes);
    }
  };

  runAction();

  const queue = {
    get isOngoing() {
      return isOngoing;
    },
    get isEnded() {
      return isEnded;
    },
    get isDraining() {
      return isDraining;
    },
    get queueSize() {
      return actionQueue.length;
    },
    get ongoingAction() {
      return ongoingAction;
    },
    get actionInQueue() {
      return actionQueue;
    },
    set actionInQueue(newActionQueue: Action[]) {
      actionQueue = newActionQueue;
    },
    addAction(action: Action) {
      queueApi.addAction(action);
    },
    endAction(action: Action) {
      action[IS_END_ACTION] = true;
      queueApi.addAction(action);
      isDraining = true;
    },
  };
  return queue;
}

import { createQueue, QueueAction } from './queue';

export type CancellableApi = {
  call<Args extends any[], Ret>(
    fn: (...args: Args) => Ret,
    ...args: Args
  ): Promise<Ret>;
  wait(duraton: number): Promise<void>;
};

export class Cancel extends Error {}
/**
 * Cancel failed due to action being already done or not using cancellable api
 */
export class ErrorCancelActionDone extends Error {}
/**
 * Cancel failed due to handle action failed
 */
export class ErrorCancelActionFailed extends Error {}

const defaultOnDone = (err: any, res?: any) => {
  if (err instanceof Cancel) {
    return;
  }
  if (err) {
    throw err;
  }
};

export const createCancellableQueue = () => {
  type Action = QueueAction<(api: CancellableApi) => void | Promise<void>>;
  const actionQueueState: {
    shouldCancel?: {
      resolve: () => void;
      reject: (err: any) => void;
      isCancelling: boolean;
    };
  } = {
    shouldCancel: null,
  };

  const checkShouldCancel = () => {
    // NOTE: should not throw when cancel is ongoing =>
    if (
      actionQueueState.shouldCancel &&
      !actionQueueState.shouldCancel.isCancelling
    ) {
      actionQueueState.shouldCancel.isCancelling = true;
      throw new Cancel();
    }
  };
  const actionApi: CancellableApi = {
    async call(fn, ...args) {
      checkShouldCancel();
      const res = await fn(...args);
      checkShouldCancel();
      return res;
    },
    wait(duration) {
      checkShouldCancel();
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            checkShouldCancel();
          } catch (err) {
            reject(err);
          }
          resolve();
        }, duration);
      });
    },
  };
  const actionQueue = createQueue<Action>({
    handleAction(cb) {
      return cb(actionApi);
    },
  });

  /**
   * transaction part allow atomic action on queue
   */
  const transactionApi = {
    ongoingAction() {
      return actionQueue.ongoingAction;
    },
    async cancelOngoing() {
      if (!actionQueue.ongoingAction) {
        return;
      }
      if (actionQueueState.shouldCancel) {
        throw new Error('Already cancel ongoing');
      }
      const p = new Promise<void>((resolve, reject) => {
        actionQueueState.shouldCancel = {
          resolve,
          reject,
          isCancelling: false,
        };
      });
      await p;
    },
    filterQueue(filterFn: (action: Action) => boolean) {
      actionQueue.actionInQueue = actionQueue.actionInQueue.filter(filterFn);
    },
    addAction(action: Action) {
      actionQueue.addAction({
        data: action.data,
        onDone(err, res) {
          if (actionQueueState.shouldCancel) {
            const shouldCancel = actionQueueState.shouldCancel;
            actionQueueState.shouldCancel = null;

            if (err instanceof Cancel) {
              shouldCancel.resolve();
            } else if (err) {
              // error that is not cancel => action failed
              shouldCancel.reject(new ErrorCancelActionFailed());
            } else if (!shouldCancel.isCancelling) {
              // no error and is not cancelling => action is already done or has not used cancellable api
              shouldCancel.reject(new ErrorCancelActionDone());
            }
          }
          const onDone = action.onDone || defaultOnDone;
          onDone(err, res);
        },
      });
    },
  };
  const transactionQueue = createQueue<
    QueueAction<(api: typeof transactionApi) => void | Promise<void>>
  >({
    handleAction: (cb) => {
      return cb(transactionApi);
    },
  });

  return {
    get isActionOngoing() {
      return actionQueue.isOngoing;
    },
    get queueSize() {
      return actionQueue.queueSize;
    },
    get ongoingAction() {
      return actionQueue.ongoingAction;
    },
    transaction(fn: (api: typeof transactionApi) => void | Promise<void>) {
      transactionQueue.addAction({
        data: fn,
      });
    },
  };
};

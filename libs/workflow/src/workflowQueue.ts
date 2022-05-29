import { isPromise } from './utils';

export type WorkflowActionPromiseApiFn<Arg = any, Ret = void> = (
  arg: Arg,
  api: WorkflowPromiseApi
) => Ret extends Promise<any> ? Ret : Ret | Promise<Ret>;

export type WorkflowPromiseApi = {
  call<T, Args extends any[]>(
    fn: (...args: Args) => T,
    ...args: Args
  ): Promise<T>;
  wait(duration: number): Promise<void>;
  run<Arg, Ret>(
    fn: WorkflowActionPromiseApiFn<Arg, Ret>,
    arg: Arg
  ): ReturnType<WorkflowActionPromiseApiFn<Arg, Ret>>;
};

export type WorkflowEntityInternalAction<Arg = any, Ret = any> = {
  name: string;
  handler: WorkflowActionPromiseApiFn<Arg, Ret>;
  arg: Arg;
  cancel?: () => void | Promise<void>;
  /**
   * called after action is marked as done
   */
  onDone?: (err?: any, result?: Ret) => void;
};

export const WorkflowCancel = Symbol('workflow cancel');

export type WorkflowQueueTransactionApi = {
  ongoingAction(): { name: string; arg: any };
  cancelOngoing(): Promise<void>;
  addAction(action: WorkflowEntityInternalAction): void;
  filterQueue: (cb: (action: WorkflowEntityInternalAction) => boolean) => void;
};

type WorkflowQueueState = {
  isActionOngoing?: boolean;
  ongoingAction?: WorkflowEntityInternalAction;
  shouldCancel?: {
    isCancelling: boolean;
    resolve: () => void;
  };
};
/**
 * Workflow Queue contain two queue
 * one for processing actions and one for interacting with the queue (add action, cancel action, ...)
 */
export const createWorkflowQueue = () => {
  let actionQueue: WorkflowEntityInternalAction[] = [];

  const state: WorkflowQueueState = {
    isActionOngoing: false,
    ongoingAction: null,
    shouldCancel: null,
  };

  const promiseSagaApiCheckCancelled = () => {
    if (state.shouldCancel && !state.shouldCancel.isCancelling) {
      state.shouldCancel.isCancelling = true;
      throw WorkflowCancel;
    }
  };
  const promiseSagaApi: WorkflowPromiseApi = {
    async call(fn, ...args) {
      promiseSagaApiCheckCancelled();
      const res = await fn(...args);
      promiseSagaApiCheckCancelled();
      return res;
    },
    wait(duration) {
      promiseSagaApiCheckCancelled();
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            promiseSagaApiCheckCancelled();
          } catch (err) {
            reject(err);
          }
          resolve();
        }, duration);
      });
    },
    run(fn, arg) {
      return fn(arg, promiseSagaApi);
    },
  };
  const runAction = () => {
    if (state.isActionOngoing || !actionQueue.length) {
      return;
    }

    const event = actionQueue.shift();
    state.ongoingAction = event;
    state.isActionOngoing = true;

    const onFinally = (err: any, res?: any) => {
      state.isActionOngoing = false;
      state.ongoingAction = null;

      const shouldCancel = state.shouldCancel;
      if (shouldCancel) {
        state.shouldCancel = null;
        shouldCancel.resolve();
      }
      if (typeof event.onDone === 'function') {
        event.onDone(err, res);
      }

      setImmediate(runAction);
    };

    try {
      const res = event.handler(event.arg, promiseSagaApi);
      if (isPromise(res)) {
        res
          .then((r) => {
            onFinally(null, r);
          })
          .catch((err) => {
            onFinally(err);
            if (!event.onDone && err !== WorkflowCancel) {
              throw err;
            }
          });
      } else {
        if (typeof event.onDone === 'function') {
          event.onDone(null, res);
        }
        state.isActionOngoing = false;
        state.ongoingAction = null;
        runAction();
      }
    } catch (err) {
      if (typeof event.onDone === 'function') {
        event.onDone(err);
      }
    }
  };

  const transactionQueue: (() => void | Promise<void>)[] = [];
  let isTransactionOngoing = false;
  const transactionApi: WorkflowQueueTransactionApi = {
    ongoingAction() {
      if (state.ongoingAction) {
        return { name: state.ongoingAction.name, arg: state.ongoingAction.arg };
      }
      return null;
    },
    async cancelOngoing() {
      if (!state.isActionOngoing) {
        return;
      }

      if (state.shouldCancel) {
        throw new Error('Already cancel ongoing');
      }

      const p = new Promise<void>((resolve) => {
        state.shouldCancel = {
          resolve,
          isCancelling: false,
        };
      });
      await p;
    },
    filterQueue(cb: (action: WorkflowEntityInternalAction) => boolean) {
      actionQueue = actionQueue.filter(cb);
    },
    addAction(action: WorkflowEntityInternalAction) {
      actionQueue.push(action);
      setImmediate(runAction);
    },
  };
  const runTransaction = () => {
    if (isTransactionOngoing) {
      return;
    }

    if (!transactionQueue.length) {
      return;
    }
    const cb = transactionQueue.shift();
    isTransactionOngoing = true;
    const r = cb();
    if (isPromise(r)) {
      r.finally(() => {
        isTransactionOngoing = false;
        runTransaction();
      });
    } else {
      isTransactionOngoing = false;
      runTransaction();
    }
  };

  const sagaQueue = {
    get isActionOngoing() {
      return state.isActionOngoing === true;
    },
    get actionQueueSize() {
      return actionQueue.length;
    },
    get ongoingAction() {
      return state.ongoingAction;
    },
    transaction: (
      cb: (trxApi: typeof transactionApi) => void | Promise<void>
    ) => {
      transactionQueue.push(() => {
        return cb(transactionApi);
      });
      runTransaction();
    },
  };

  return sagaQueue;
};

export const wkAction = <Arg = void>(
  handler: (arg: Arg, api: WorkflowPromiseApi) => void | Promise<void>
) => handler;

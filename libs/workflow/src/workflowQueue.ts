import { isPromise } from "./utils";

export type WorkflowActionPromiseApiFn<Arg = any> = (
  arg: Arg,
  api: WorkflowPromiseApi
) => void | Promise<void>;

export type WorkflowPromiseApi = {
  call<T, Args extends any[]>(
    fn: (...args: Args) => T,
    ...args: Args
  ): Promise<T>;
  wait(duration: number): Promise<void>;
};

export type WorkflowEntityInternalAction<T = any> = {
  name: string;
  handler: WorkflowActionPromiseApiFn<T>;
  arg: T;
  cancel?: () => void | Promise<void>;
};

export const WorkflowCancel = Symbol("workflow cancel");

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

export const createWorkflowQueue = () => {
  let actionQueue: WorkflowEntityInternalAction[] = [];

  const state: WorkflowQueueState = {
    isActionOngoing: false,
    ongoingAction: null,
    shouldCancel: null,
  };

  // const runGeneratorSaga = async (saga: Generator) => {
  //   let sagaIt: IteratorResult<any> = null;

  //   let sagaRes = undefined;
  //   let sagaErr: undefined | { err: unknown } = undefined;

  //   do {
  //     if (state.shouldCancel && !state.shouldCancel.isCancelling) {
  //       state.shouldCancel.isCancelling = true;
  //       sagaIt = saga.throw(WorkflowCancel);
  //     }
  //     sagaIt = sagaErr ? saga.throw(sagaErr.err) : saga.next(sagaRes);
  //     const { value } = sagaIt;
  //     if (value === WorkflowCancel) {
  //       throw WorkflowCancel;
  //     }
  //     try {
  //       if (isGenerator(value)) {
  //         sagaRes = await runGeneratorSaga(value);
  //       } else if (isPromise(value)) {
  //         sagaRes = await value;
  //       } else {
  //         sagaRes = value;
  //       }
  //       sagaErr = undefined;
  //     } catch (err) {
  //       sagaErr = { err };
  //     }
  //   } while (sagaIt && !sagaIt.done);
  // };

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
  };
  const runAction = () => {
    if (state.isActionOngoing || !actionQueue.length) {
      return;
    }

    const onFinally = () => {
      state.isActionOngoing = false;
      state.ongoingAction = null;

      const shouldCancel = state.shouldCancel;
      if (shouldCancel) {
        state.shouldCancel = null;
        shouldCancel.resolve();
      }

      setImmediate(runAction);
    };

    const event = actionQueue.shift();
    state.ongoingAction = event;
    state.isActionOngoing = true;
    const res = event.handler(event.arg, promiseSagaApi);
    // if (isGenerator(res)) {
    //   runGeneratorSaga(res)
    //     .catch((err) => {
    //       if (err !== WorkflowCancel) {
    //         throw err;
    //       }
    //     })
    //     .finally(onFinally);
    // } else
    if (isPromise(res)) {
      res
        .catch((err) => {
          if (err !== WorkflowCancel) {
            throw err;
          }
        })
        .finally(onFinally);
    } else {
      state.isActionOngoing = false;
      state.ongoingAction = null;
      runAction();
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
        throw new Error("Already cancel ongoing");
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
  handler: (arg: Arg, wkApi: WorkflowPromiseApi) => void | Promise<void>
) => handler;

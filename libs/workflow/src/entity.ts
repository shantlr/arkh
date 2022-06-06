import {
  CancellableAction,
  CancellableApi,
  createCancellableQueue,
  TransactionApi,
} from './cancellableQueue';
import { mapObject } from './utils';

type EntityAction = CancellableAction;

export type Entity<State, Actions extends EntityActionHandlerMap> = {
  state: State;
  actions: EntityActionCreatorMap<Actions>;
  get isActionOngoing(): boolean;
  get actionQueueSize(): number;
  get ongoingAction(): EntityAction;
};

export function createEntity<State, Actions extends EntityActionHandlerMap>(
  state: State,
  {
    actions,
  }: {
    actions: Actions;
  }
): Entity<State, Actions> {
  const queue = createCancellableQueue();

  const createEntityActionApi = (cancellableApi: CancellableApi) => {
    const ongoingPromise: Promise<any> = null;
    const api: EntityActionApi = {
      ...cancellableApi,
      do: async (actionCreator, arg) => {
        if (ongoingPromise) {
          throw new Error('Another action already ongoing');
        }

        if (!actionCreatorMapping.has(actionCreator)) {
          throw new Error(`api.do: unknown action creator`);
        }

        const handler = actionCreatorMapping.get(actionCreator);
        return handler.handler(arg, api);
      },
    };

    return {
      api,
      ensureActionDone: () => {
        return ongoingPromise;
      },
    };
  };

  const createActionCreator = (
    actionName: keyof Actions,
    handler: EntityActionAdvHandler<unknown>
  ): EntityActionCreator<unknown> => {
    return (arg: unknown, { promise }: { promise?: boolean } = {}) => {
      if (promise) {
        return new Promise<void>((resolve, reject) => {
          queue.transaction(async (trx) => {
            if (handler.beforeEmitAction) {
              await handler.beforeEmitAction(arg, trx);
            }
            trx.addAction({
              data: async (api) => {
                const { api: wrappedApi, ensureActionDone } =
                  createEntityActionApi(api);
                const res = await handler.handler(arg, wrappedApi);
                await ensureActionDone();
                return res;
              },
              onDone(err, res) {
                if (err) {
                  reject(err);
                } else {
                  resolve(res);
                }
              },
            });
          });
        });
      }
      queue.transaction(async (trx) => {
        if (handler.beforeEmitAction) {
          await handler.beforeEmitAction(arg, trx);
        }
        trx.addAction({
          data: async (api) => {
            const res = await handler.handler(arg, {
              ...api,
              async do() {
                //
              },
            });
            return res;
          },
        });
      });
    };
  };

  const actionCreators = mapObject(actions, (act, actionName) => {
    if (typeof act === 'function') {
      return createActionCreator(actionName, {
        handler: act,
      });
    }
    return createActionCreator(actionName, act);
  });
  const actionCreatorMapping = new Map();
  Object.keys(actionCreators).forEach((k) => {
    actionCreatorMapping.set(actionCreators[k], actions[k]);
  });

  return {
    state,
    actions: actionCreators,
    get isActionOngoing() {
      return queue.isActionOngoing;
    },
    get actionQueueSize() {
      return queue.actionQueueSize;
    },
    get ongoingAction() {
      return queue.ongoingAction;
    },
  };
}

type EntityActionApi = CancellableApi & {
  /**
   * Run another action of entity
   */
  do<T>(actionCreator: EntityActionCreator<T>, arg: T): Promise<void>;
};
type BeforeEmiActionApi = TransactionApi;

/** INPUT TYPES */
type EntityActionHandler<Arg> = (
  arg: Arg,
  api: EntityActionApi
) => void | Promise<void>;
type EntityActionAdvHandler<Arg> = {
  beforeEmitAction?: (
    arg: Arg,
    api: BeforeEmiActionApi
  ) => void | Promise<void>;
  handler: EntityActionHandler<Arg>;
};

export type EntityActionHandlerMap = Record<
  string,
  EntityActionHandler<any> | EntityActionAdvHandler<any>
>;

/** Mapped types */

/**
 * Extract arg of action handler
 */
type ActionHandlerArg<
  Handler extends EntityActionAdvHandler<any> | EntityActionHandler<any>
> = Handler extends EntityActionHandler<infer Arg>
  ? Arg
  : Handler extends EntityActionAdvHandler<infer Arg>
  ? Arg
  : never;
interface EntityActionCreator<Arg = void> {
  (arg: Arg, options: { promise: true }): Promise<void>;
  (arg: Arg, options?: { promise?: boolean }): void;
}
export type EntityActionCreatorMap<Actions extends EntityActionHandlerMap> = {
  [key in keyof Actions]: EntityActionCreator<ActionHandlerArg<Actions[key]>>;
};

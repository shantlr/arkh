import {
  CancellableAction,
  CancellableApi,
  createCancellableQueue,
  TransactionApi,
} from './cancellableQueue';
import { QueueAction } from './queue';
import { mapObject } from './utils';

type EntityAction = CancellableAction;

type Entity<State, Actions extends EntityActionHandlerMap> = {
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

  const createActionCreator = (
    actionName: keyof Actions,
    handler: EntityActionAdvHandler<unknown>
  ): EntityActionCreator<unknown> => {
    return (arg: unknown, { promise }: { promise?: boolean }) => {
      if (promise) {
        return new Promise<void>((resolve, reject) => {
          queue.transaction(async (trx) => {
            if (handler.beforeEmitAction) {
              await handler.beforeEmitAction(arg, trx);
            }
            trx.addAction({
              data: (api) => handler.handler(arg, api),
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
          data: (api) => {
            handler.handler(arg, api);
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

type EntityActionApi = CancellableApi;
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

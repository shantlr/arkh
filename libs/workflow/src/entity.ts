import {
  createWorkflowQueue,
  WorkflowActionPromiseApiFn,
} from './workflowQueue';
import { mapObject } from './utils';
import {
  WorkflowActionHandlerDef,
  WorkflowActionHandlerMap,
  WorkflowEntityActionCreators,
  WorkflowEntityInternalActionCreators,
} from './types';

export type WorkflowEntity<
  State,
  ActionWorkflows extends WorkflowActionHandlerMap<any>,
  InternalActions extends Record<string, WorkflowActionPromiseApiFn>
> = {
  state: State;
  actions: WorkflowEntityActionCreators<ActionWorkflows>;

  get isActionOngoing(): boolean;
  get actionQueueSize(): number;
  get ongoingAction(): { name: string };
  // transaction: (
  //   handler: () => void,
  //   options: { promise: true }
  // ) => Promise<void>;
  internalActions: WorkflowEntityInternalActionCreators<InternalActions>;
};

export const createWorkflowEntity = <
  State,
  InternalActions extends Record<string, WorkflowActionPromiseApiFn<any>>,
  HandlerMap extends WorkflowActionHandlerMap<any>
>(
  state: State,
  params: {
    actions: HandlerMap;
    internalActions?: InternalActions;
  }
): WorkflowEntity<State, HandlerMap, InternalActions> => {
  const queue = createWorkflowQueue();

  const createActionCreator =
    <T>(actionName: string, act: WorkflowActionHandlerDef<T>) =>
    (arg: T, { promise }: { promise?: boolean } = {}) => {
      if (promise) {
        return new Promise((resolve, reject) => {
          queue.transaction(async (trxApi) => {
            if (act.beforeEmitAction) {
              await act.beforeEmitAction(trxApi);
            }
            trxApi.addAction({
              name: actionName,
              handler: act.handler,
              arg,
              cancel: reject,
              // resolve in after done to ensure that promise is resolved only when action is marked as done
              afterDone(err, result) {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              },
            });
          });
        });
      }

      void queue.transaction(async (trxApi) => {
        if (act.beforeEmitAction) {
          await act.beforeEmitAction(trxApi);
        }
        trxApi.addAction({
          name: actionName,
          handler: act.handler,
          arg,
        });
      });
    };

  return {
    state,
    actions: mapObject(params.actions, (act, actionName) => {
      if (typeof act === 'function') {
        return createActionCreator(actionName, {
          handler: act,
        });
      } else {
        return createActionCreator(actionName, act);
      }
    }) as WorkflowEntityActionCreators<HandlerMap>,
    get isActionOngoing() {
      return queue.isActionOngoing;
    },
    get actionQueueSize() {
      return queue.actionQueueSize;
    },
    get ongoingAction() {
      return queue.ongoingAction;
    },

    // transaction: (handler, { promise } = {}) => {
    //   queue.transaction((trxApi) => {
    //     handler();
    //   });
    // },

    internalActions: mapObject(params.internalActions, (act, actionName) => {
      return createActionCreator(`@internal/${actionName}`, {
        handler: act,
      });
    }) as WorkflowEntityInternalActionCreators<InternalActions>,
  };
};

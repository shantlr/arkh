import {
  createWorkflowQueue,
  WorkflowActionPromiseApiFn,
} from "./workflowQueue";
import { mapObject } from "./utils";
import {
  WorkflowActionHandlerDef,
  WorkflowActionHandlerMap,
  WorkflowEntityActionCreators,
  WorkflowEntityInternalActionCreators,
} from "./types";

export { wkAction } from "./workflowQueue";

export type WorkflowEntity<
  State,
  ActionWorkflows extends WorkflowActionHandlerMap,
  InternalActions extends Record<string, WorkflowActionPromiseApiFn>
> = {
  state: State;
  actions: WorkflowEntityActionCreators<ActionWorkflows>;
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
              handler: async (a, api) => {
                try {
                  const r = await act.handler(a, api);
                  resolve(r);
                } catch (err) {
                  reject(err);
                }
              },
              arg,
              cancel: reject,
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
      if (typeof act === "function") {
        return createActionCreator(actionName, {
          handler: act,
        });
      } else {
        return createActionCreator(actionName, act);
      }
    }) as WorkflowEntityActionCreators<HandlerMap>,

    internalActions: mapObject(params.internalActions, (act, actionName) => {
      return createActionCreator(`@internal/${actionName}`, {
        handler: act,
      });
    }) as WorkflowEntityInternalActionCreators<InternalActions>,
  };
};

// const test = createWorkflowEntity(
//   {},
//   {
//     actions: {
//       test(t: void, api) {},
//     },
//   }
// );

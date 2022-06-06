// import {
//   WorkflowActionHandlerDef,
//   WorkflowActionHandlerMap,
//   WorkflowEntityPromiseApi,
// } from './types';
// import { WorkflowActionPromiseApiFn } from './workflowQueue';

// export const createLatests = <HandlerMap extends WorkflowActionHandlerMap<any>>(
//   actionMap: HandlerMap
// ) => {
//   const res: Record<
//     string,
//     WorkflowActionHandlerDef<any, WorkflowEntityPromiseApi>
//   > = {};
//   for (const [actionName, actionHandler] of Object.entries(actionMap)) {
//     if (typeof actionHandler === 'function') {
//       res[actionName] = {
//         async beforeEmitAction(trxApi) {
//           if (
//             trxApi.ongoingAction &&
//             trxApi.ongoingAction.name === actionName
//           ) {
//             await trxApi.cancelOngoing();
//           }
//           trxApi.filterQueue((act) => act.name !== actionName);
//         },
//         handler: actionHandler,
//       };
//     }
//   }
//   return res as {
//     [key in keyof HandlerMap]: WorkflowActionHandlerDef<
//       HandlerMap[key] extends WorkflowActionPromiseApiFn<infer A>
//         ? A
//         : HandlerMap[key] extends WorkflowActionHandlerDef<infer A, HandlerMap>
//         ? A
//         : never,
//       WorkflowEntityPromiseApi
//     >;
//   };
// };

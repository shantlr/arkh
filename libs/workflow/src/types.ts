import {
  WorkflowActionPromiseApiFn,
  WorkflowQueueTransactionApi,
} from "./workflowQueue";

export type WorkflowActionHandlerDef<Arg> = {
  beforeEmitAction?: (
    trxApi: WorkflowQueueTransactionApi
  ) => void | Promise<void>;
  handler: WorkflowActionPromiseApiFn<Arg>;
};

export type WorkflowActionHandlerMap<Arg = void> = {
  [key: string]:
    | WorkflowActionPromiseApiFn<Arg>
    | WorkflowActionHandlerDef<Arg>;
};

export interface ActionCreator<Arg, Ret> {
  (arg: Arg, options: { promise?: true }): Promise<Awaited<Ret>>;
  (arg: Arg, options?: { promise?: boolean }): void;
}

/**
 * Entity
 */
export type WorkflowEntityActionCreators<
  ActionHandlerMap extends WorkflowActionHandlerMap
> = {
  [key in keyof ActionHandlerMap]: ActionHandlerMap[key] extends WorkflowActionPromiseApiFn<
    infer Arg
  >
    ? ActionCreator<Arg, ReturnType<ActionHandlerMap[key]>>
    : ActionHandlerMap[key] extends WorkflowActionHandlerDef<infer Arg>
    ? ActionCreator<Arg, ReturnType<ActionHandlerMap[key]["handler"]>>
    : never;
};
export type WorkflowEntityInternalActionCreators<
  InternalWorkflows extends Record<string, WorkflowActionPromiseApiFn>
> = {
  [key in keyof InternalWorkflows]: (
    arg: Parameters<InternalWorkflows[key]>[0]
  ) => Promise<ReturnType<InternalWorkflows[key]>>;
};
export interface WorkflowEntityTransaction {
  (): void;
  (): Promise<void>;
}

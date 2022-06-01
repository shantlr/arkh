import { createWorkflowEntity, WorkflowEntity } from './entity';
import { WorkflowActionHandlerMap } from './types';
import { WorkflowActionPromiseApiFn } from './workflowQueue';

export type WorkflowEntityGroupMember<
  Entity extends WorkflowEntity<any, any, any>,
  Key extends string | number | symbol
> = WorkflowEntity<
  {
    key: Key;
    entity: Entity;
    isLeaving: boolean;
  },
  {
    push: WorkflowActionPromiseApiFn<{
      actionName: string | number | symbol;
      arg: any;
    }>;
    leave: WorkflowActionPromiseApiFn<{
      handler?: (entity: Entity, key: Key) => void | Promise<void>;
    }>;
  },
  any
>;

export type WorkflowEntityMemberProxy<
  Entity extends WorkflowEntity<any, any, any>
> = {
  state: Entity['state'];
  actions: Entity['actions'];
};

/**
 * Workflow entity group allow to manage a pool entities lifecycle
 * Entity will be created automatically when used
 * Entity can leave the group with async logic without race condition
 */
export type WorkflowEntityGroup<
  Entity extends WorkflowEntity<any, any, any>,
  GroupActionHandlers extends WorkflowActionHandlerMap<any>,
  Key extends string | number | symbol
> = WorkflowEntity<any, GroupActionHandlers, any> & {
  keys(): Key[];
  get(key: Key): WorkflowEntityMemberProxy<Entity>;
  has(key: Key): boolean;
  isLeaving(key: Key): boolean;
  /**
   *
   */
  leave(key: Key, handler?: () => void | Promise<void>): Promise<void>;
};

const createEntityMember = <
  Entity extends WorkflowEntity<any, any, any>,
  Key extends string | number | symbol
>({
  memberKey,
  initEntity,
  leaveEntity,
}: {
  memberKey: Key;
  initEntity: (key: Key) => Entity;
  leaveEntity?: (entity: Entity, key: Key) => void | Promise<void>;
}) => {
  const state: {
    key: Key;
    entity: Entity;
    isLeaving: boolean;
  } = {
    key: memberKey,
    entity: null,
    isLeaving: false,
  };

  // NOTE: all actions are wrapped in member workflow to ensure all
  // action related to member does not have race condition
  return createWorkflowEntity(state, {
    actions: {
      push({ actionName, arg }) {
        if (!state.entity) {
          // init entity if missing
          state.entity = initEntity(memberKey);
        }

        if (!(actionName in state.entity.actions)) {
          throw new Error(`action '${String(actionName)}' does not exists`);
        }

        return state.entity.actions[actionName as keyof Entity['actions']](
          arg,
          { promise: true }
        );
      },
      async leave({ handler }) {
        if (!state.entity) {
          return;
        }

        state.isLeaving = true;

        if (typeof leaveEntity === 'function') {
          await leaveEntity(state.entity, memberKey);
        }
        if (typeof handler === 'function') {
          await handler(state.entity, memberKey);
        }
        state.entity = null;
      },
    },
  });
};

const createEntityMemberProxy = <
  Entity extends WorkflowEntity<any, any, any>,
  Key extends string | number | symbol
>({
  initEntity,
  leaveEntity,
  members,
  memberKey,
}: {
  initEntity: (key: Key) => Entity;
  leaveEntity?: (entity: Entity, key: Key) => void | Promise<void>;
  members: Record<Key, WorkflowEntityGroupMember<Entity, Key>>;
  memberKey: Key;
}): WorkflowEntityMemberProxy<Entity> => {
  const actionState: Entity['actions'] = {};

  return {
    get state() {
      if (!members[memberKey]) {
        members[memberKey] = createEntityMember({
          memberKey,
          initEntity,
          leaveEntity,
        });
      }
      return members[memberKey].state.sentity.state;
    },
    actions: new Proxy<Entity['actions']>(actionState, {
      get(target, actionName: keyof Entity['actions']) {
        if (!target[actionName]) {
          // lazily init wrapped action creator
          target[actionName] = ((
            arg: any,
            { promise }: { promise?: boolean } = {}
          ) => {
            // init entity if missing
            if (!members[memberKey]) {
              members[memberKey] = createEntityMember({
                memberKey,
                initEntity,
                leaveEntity,
              });
            }

            const member = members[memberKey];

            return member.actions.push({ actionName, arg }, { promise });
          }) as unknown as Entity['actions'][typeof actionName];
        }
        return target[actionName];
      },
    }),
  };
};

export const createWorkflowEntityGroup = <
  Entity extends WorkflowEntity<any, any, any>,
  GroupActionHandlers extends WorkflowActionHandlerMap<any>,
  Key extends string | number | symbol = string
>({
  name,
  initEntity,
  leaveEntity,

  actions,
}: {
  /**
   * Group name
   */
  name?: string;
  initEntity: (key: Key) => Entity;
  /**
   * Handler called when entity is leaving
   */
  leaveEntity?: (entity: Entity, key: Key) => Promise<void> | void;

  actions?: GroupActionHandlers;
}): WorkflowEntityGroup<Entity, GroupActionHandlers, Key> => {
  const members = {} as Record<Key, WorkflowEntityGroupMember<Entity, Key>>;

  const group: WorkflowEntityGroup<Entity, GroupActionHandlers, Key> = {
    ...createWorkflowEntity(null, {
      actions,
    }),
    get(key: Key) {
      return createEntityMemberProxy({
        initEntity,
        leaveEntity,
        members,
        memberKey: key,
      });
    },
    has(key: Key) {
      return key in members;
    },
    keys() {
      return Object.keys(members) as Key[];
    },
    isLeaving(key: Key) {
      return key in members && members[key].state.isLeaving;
    },
    async leave(
      key: Key,
      handler?: (entity: Entity, key: Key) => void | Promise<void>
    ) {
      if (!(key in members)) {
        throw new Error(
          `workflow group '${name}' could not leave member '${key}': member does not exist`
        );
      }

      const member = members[key];
      await member.actions.leave({ handler }, { promise: true });

      if (!member.isActionOngoing && !member.actionQueueSize) {
        // Remove member from group if no more action
        delete members[key];
      }
    },
  };

  return group;
};

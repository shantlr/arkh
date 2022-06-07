import { createEntity, Entity } from './entity';

export type Group<Ent extends IEntity, Key extends string | number | symbol> = {
  /**
   * always return a member proxy
   */
  bring(key: Key): GroupMemberProxy<Ent>;
  /**
   * return a member proxy only if member already exists
   */
  get(key: Key): GroupMemberProxy<Ent> | undefined;
  has(key: Key): boolean;
  keys(): Key[];
  isLeaving(key: Key): boolean;

  /**
   * Make entity corresponding to key to leave group
   * an optional handler may be provided to do some action before
   */
  leave(
    key: Key,
    handler?: (entity: Ent, key: Key) => void | Promise<void>
  ): Promise<void>;

  [Symbol.iterator]: () => Generator<GroupMemberProxy<Ent>, void, void>;
};
export type GroupMemberProxy<Entity extends IEntity> = {
  state: Entity['state'];
  actions: Entity['actions'];
};

export const createGroup = <
  Ent extends IEntity,
  Key extends string | number | symbol = string
>({
  name,
  initEntity,
  leaveEntity,
}: {
  name?: string;
  initEntity: (key: Key) => Ent;
  leaveEntity?: (entity: Ent, key: Key) => void | Promise<void>;
}): Group<Ent, Key> => {
  const members: { [key in Key]?: GroupMember<Ent, Key> } = {};

  const group: Group<Ent, Key> = {
    bring(key) {
      return createGroupMemberProxy({
        name,
        initEntity,
        leaveEntity,
        key,
        members,
      });
    },
    get(key) {
      if (key in members) {
        return group.bring(key);
      }
      return undefined;
    },
    has(key) {
      return key in members;
    },
    keys() {
      return Object.keys(members) as Key[];
    },
    isLeaving(key) {
      return key in members;
    },
    async leave(key, handler) {
      if (!(key in members)) {
        throw new Error(
          `group could not leave member '${String(key)}': member does not exist`
        );
      }

      const member = members[key];
      await member.actions.leave({ handler }, { promise: true });

      if (!member.isActionOngoing && !member.actionQueueSize) {
        // Remove member from group if no more action
        delete members[key];
      }
    },
    [Symbol.iterator]: function* () {
      for (const [key] of Object.entries(members)) {
        yield group.bring(key as Key);
      }
    },
  };
  return group;
};

function createEntityMember<
  Ent extends IEntity,
  Key extends string | number | symbol
>({
  name,
  memberKey,
  initEntity,
  leaveEntity,
}: {
  name: string;
  memberKey: Key;
  initEntity: (key: Key) => Ent;
  leaveEntity?: (entity: Ent, key: Key) => void | Promise<void>;
}): GroupMember<Ent, Key> {
  const state: GroupMember<Ent, Key>['state'] = {
    isLeaving: false,
    entity: null,
  };
  const getEntity = () => {
    if (!state.entity) {
      state.entity = initEntity(memberKey);
    }
    return state.entity;
  };
  return createEntity(state, {
    actions: {
      forwardAction({ actionName, arg }) {
        const entity = getEntity();
        if (!(actionName in entity.actions)) {
          throw new Error(
            `action '${String(
              actionName
            )}' does not exist in entity of group '${name}'`
          );
        }

        return entity.actions[actionName](arg, { promise: true });
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
}
function createGroupMemberProxy<
  Ent extends IEntity,
  Key extends string | number | symbol
>({
  name,
  initEntity,
  leaveEntity,
  key: memberKey,
  members,
}: {
  name: string;
  initEntity: (key: Key) => Ent;
  leaveEntity?: (entity: Ent, key: Key) => void | Promise<void>;
  key: Key;
  members: { [key in Key]?: GroupMember<Ent, Key> };
}): GroupMemberProxy<Ent> {
  const getMember = (): GroupMember<Ent, Key> => {
    if (!members[memberKey]) {
      members[memberKey] = createEntityMember({
        name,
        memberKey,
        initEntity,
        leaveEntity,
      });
    }
    return members[memberKey];
  };

  const actionTarget = {} as Partial<Ent['actions']>;

  return {
    get state() {
      return getMember().state.entity.state;
    },
    actions: new Proxy(actionTarget, {
      get(target, prop) {
        const actionName = prop as keyof Ent['actions'];
        if (!target[actionName]) {
          target[actionName] = function proxyAction(arg, options) {
            const member = getMember();
            return member.actions.forwardAction(
              {
                actionName,
                arg,
              },
              options
            );
          } as unknown as Ent['actions'][typeof actionName];
        }

        return target[actionName];
      },
    }),
  };
}

type IEntity = Entity<any, any>;
export type GroupMember<
  Ent extends IEntity,
  Key extends string | number | symbol
> = Entity<
  {
    entity: Ent;
    isLeaving: boolean;
  },
  {
    forwardAction<ActionName extends keyof Ent['actions']>(arg: {
      actionName: ActionName;
      arg: Parameters<Ent['actions'][ActionName]>[0];
    }): void;
    leave: (arg: {
      handler: (entity: Ent, key: Key) => void | Promise<void>;
    }) => void;
  }
>;

import {
  ShipyardFileSpec,
  StackSpec,
  ServiceSpec,
  Task as TaskType,
  TaskLog as TaskLogType,
  StackTabConfig,
  StackTab as StackTabType,
} from '@shantlr/shipyard-common-types';
import { sortBy } from 'lodash';
import { Logger } from '@shantlr/shipyard-logger';

import { SideEffects } from '../workflow/sideEffects';
import {
  addStaticMethods,
  createEntityAccessorBase,
  createNamedEntityAccessor,
  deserializer,
  serializer,
  StringifyNonScalar,
} from '../lib/db';
import { servicesWorkflow } from '../workflow';

import { knex } from './knex';

export { doMigrations } from './knex';

export const Config = createNamedEntityAccessor<{
  spec: ShipyardFileSpec;
}>({
  collectionName: 'configs',
  knex,
  deserializeDoc: deserializer({
    spec(value) {
      return JSON.parse(value);
    },
  }),
  serializeDoc: serializer({
    spec: (v) => JSON.stringify(v),
  }),
});
export const Stack = addStaticMethods(
  createNamedEntityAccessor<{
    spec: StackSpec;
    config_key: string;
    to_remove?: boolean;
  }>({
    collectionName: 'stacks',
    knex,
    deserializeDoc: deserializer({
      spec(value) {
        return JSON.parse(value);
      },
    }),
    serializeDoc: serializer({
      spec: (v) => JSON.stringify(v),
    }),
  }),
  {
    ofConfig(configKey: string) {
      return this.find({
        config_key: configKey,
      });
    },
  }
);
export const Service = addStaticMethods(
  createNamedEntityAccessor<{
    spec: ServiceSpec;
    key: string;
    stack: string;
    to_delete?: boolean;
  }>({
    collectionName: 'services',
    knex,
    deserializeDoc: deserializer({
      spec(value) {
        return JSON.parse(value);
      },
    }),
    serializeDoc: serializer({
      spec: (v) => JSON.stringify(v),
    }),
  }),
  {
    getStackNameFromName(serviceName: string): string {
      return serviceName.split('.')[0];
    },
    splitFullName(serviceName: string) {
      const [stackName, serviceKey] = serviceName.split('.');
      return {
        stackName,
        serviceKey,
      };
    },
    formatName(stackName: string, key: string) {
      return `${stackName}.${key}`;
    },
  }
);

const taskAccessor = createEntityAccessorBase<
  TaskType,
  StringifyNonScalar<TaskType>
>({
  collectionName: 'tasks',
  knex,
  deserializeDoc: deserializer({
    service_spec: (value) => {
      if (value) {
        return JSON.parse(value);
      }
      return null;
    },
  }),
  serializeDoc: serializer({
    service_spec: (value) => JSON.stringify(value),
  }),
});

export const Task = {
  async create({
    id,
    serviceName,
    serviceSpec,
    runnerId,
  }: {
    id: string;
    serviceName: string;
    serviceSpec: ServiceSpec;
    runnerId: string;
  }) {
    const date = new Date();
    await taskAccessor.insertOne({
      id,
      service_name: serviceName,
      service_spec: serviceSpec,
      runner_id: runnerId,
      creating_at: date,
      updated_at: date,
    });
    void SideEffects.emit('addTask', {
      id,
      created_at: date,
      serviceName,
    });
  },
  update: {
    async runningAt(taskId: string) {
      const date = new Date();
      await taskAccessor.updateOne(
        {
          id: taskId,
          running_at: null,
        },
        {
          running_at: date,
          updated_at: date,
        }
      );
      void SideEffects.emit('updateTask', {
        id: taskId,
        running_at: date,
      });
    },
    async stoppingAt(taskId: string) {
      const date = new Date();
      await taskAccessor.updateOne(
        {
          id: taskId,
          stopping_at: null,
        },
        {
          stopping_at: date,
          updated_at: date,
        }
      );
      void SideEffects.emit('updateTask', {
        id: taskId,
        stopping_at: date,
      });
    },
    async stoppedAt(taskId: string) {
      const date = new Date();
      await taskAccessor.updateOne(
        {
          id: taskId,
          stopped_at: null,
        },
        {
          stopped_at: date,
          updated_at: date,
        }
      );
      void SideEffects.emit('updateTask', {
        id: taskId,
        stopped_at: date,
      });
    },
    /**
     * Consider task as stopped due to sync
     * task may not be actually stopped in runner
     */
    async syncStopped(taskId: string) {
      const date = new Date();
      await taskAccessor.updateOne(
        {
          id: taskId,
        },
        {
          stopped_at: date,
          stopping_at: date,
          exit_code: null,
          exited_at: date,
        }
      );
      void SideEffects.emit('updateTask', {
        id: taskId,
        stopped_at: date,
      });
    },
    async exited(taskId: string, exitCode: number) {
      const date = new Date();
      await taskAccessor.updateOne(
        {
          id: taskId,
          exited_at: null,
        },
        {
          exited_at: date,
          exit_code: exitCode,
          updated_at: date,
        }
      );
      void SideEffects.emit('updateTask', {
        id: taskId,
        exited_at: date,
        exit_code: exitCode,
      });
    },

    async stopRelicas(serviceName: string, logger?: Logger) {
      const tasks = await Task.list(serviceName);
      const stoppedTaskIds: string[] = [];
      await Promise.all(
        tasks.map(async (t) => {
          if (!t.exited_at) {
            if (logger) {
              logger.info(`stop relicas tasks '${t.id}'`);
            }
            await Task.update.syncStopped(t.id);
            stoppedTaskIds.push(t.id);
            if (servicesWorkflow.has(serviceName)) {
              const service = servicesWorkflow.get(serviceName);
              if (service.state.current_task_id === t.id) {
                await service.actions.stop(null, { promise: true });
              }
            }
          }
        })
      );
      return stoppedTaskIds;
    },
  },

  get(taskId: string) {
    return taskAccessor.getOne({
      id: taskId,
    });
  },
  async list(serviceName: string) {
    const res = await taskAccessor.find({
      service_name: serviceName,
    });
    return sortBy(res, (r) => -new Date(r.creating_at));
  },
};

const taskLogAccessor = createEntityAccessorBase<
  TaskLogType,
  StringifyNonScalar<TaskLogType>
>({
  collectionName: 'task_logs',
  knex,
});
export const TaskLog = {
  async add({
    id,
    out,
    text,
    date,
  }: {
    id: string;
    out: 0 | 1;
    text: string;
    date: Date;
  }) {
    await taskLogAccessor.insertOne({
      task_id: id,
      out,
      text,
      date,
    });
    await SideEffects.emit('taskLog', {
      task_id: id,
      out,
      text,
      date,
    });
  },

  async get(taskId: string) {
    const res = await taskLogAccessor.find({
      task_id: taskId,
    });
    return sortBy(res, (r) => new Date(r.date));
  },
};

const stackTabAccessor = createEntityAccessorBase<
  StackTabConfig,
  StringifyNonScalar<StackTabConfig>
>({
  collectionName: 'stack_tabs',
  knex,
  deserializeDoc: deserializer({
    tabs: (tabs) => {
      const r = JSON.parse(tabs);
      r.forEach((t) => {
        // add slug
        if (t.name) {
          t.slug = StackTab.formatSlug(t.name);
        }
      });
      return r;
    },
  }),
  serializeDoc: serializer({
    tabs: (tabs) => JSON.stringify(tabs),
  }),
});
export const StackTab = {
  formatSlug(name: string) {
    return name.replace(/[ ]+/g, '-').toLowerCase();
  },
  async deleteTab({
    stackName,
    tabName,
  }: {
    stackName: string;
    tabName: string;
  }) {
    await knex.transaction(async (trx) => {
      const stackTab = await stackTabAccessor
        .getCollection(trx)
        .select()
        .first()
        .where({
          stack: stackName,
        })
        .forUpdate()
        .then((r) => {
          if (r) {
            return stackTabAccessor.deserializeDoc(r);
          }
        });
      if (stackTab) {
        const tabIdx = stackTab.tabs.findIndex((t) => t.name === tabName);
        if (tabIdx) {
          stackTab.tabs.splice(tabIdx, 1);
          await stackTabAccessor
            .getCollection(trx)
            .update(
              stackTabAccessor.serializeDoc({
                tabs: stackTab.tabs,
              })
            )
            .where({
              stack: stackName,
            });
        }
      }
    });
  },
  async upsert(stackName: string, tabs: StackTabType[]) {
    await stackTabAccessor
      .getCollection()
      .insert({
        stack: stackName,
        tabs: JSON.stringify(tabs),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('stack')
      .merge(['tabs', 'updated_at']);
  },
  get(stackName: string) {
    return stackTabAccessor.getOne({
      stack: stackName,
    });
  },
};

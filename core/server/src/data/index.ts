import {
  addStaticMethods,
  createCollectionAccessor,
  deserializer,
  serializer,
  StringifyNonScalar,
} from 'src/lib/db';
import { knex } from './knex';
import {
  MetroSpec,
  StackSpec,
  ServiceSpec,
  Task as TaskType,
  TaskLog as TaskLogType,
} from '@shantr/metro-common-types';
import { SideEffects } from 'src/events/sideEffects';

export { doMigrations } from './knex';

export const Config = createCollectionAccessor<{
  spec: MetroSpec;
}>({
  name: 'configs',
  knex,
  mapDoc: deserializer({
    spec(value) {
      return JSON.parse(value);
    },
  }),
  serializeDoc: serializer({
    spec: (v) => JSON.stringify(v),
  }),
});
export const Stack = createCollectionAccessor<{
  spec: StackSpec;
  to_remove?: boolean;
}>({
  name: 'stacks',
  knex,
  mapDoc: deserializer({
    spec(value) {
      return JSON.parse(value);
    },
  }),
  serializeDoc: serializer({
    spec: (v) => JSON.stringify(v),
  }),
});
export const Service = addStaticMethods(
  createCollectionAccessor<{
    spec: ServiceSpec;
    key: string;
    stack: string;
  }>({
    name: 'services',
    knex,
    mapDoc: deserializer({
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

const getTask = () => knex<StringifyNonScalar<TaskType>>(`tasks`);
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
    await getTask().insert({
      id,
      service_name: serviceName,
      service_spec: JSON.stringify(serviceSpec),
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
      await getTask()
        .update({
          running_at: date,
          updated_at: date,
        })
        .where({
          id: taskId,
          running_at: null,
        })
        .returning('*');
      void SideEffects.emit('updateTask', {
        id: taskId,
        running_at: date,
      });
    },
    async stoppingAt(taskId: string) {
      const date = new Date();
      await getTask()
        .update({
          stopping_at: date,
          updated_at: date,
        })
        .where({
          id: taskId,
          stopping_at: null,
        });
      void SideEffects.emit('updateTask', {
        id: taskId,
        stopping_at: date,
      });
    },
    async stoppedAt(taskId: string) {
      const date = new Date();
      await getTask()
        .update({
          stopped_at: date,
          updated_at: date,
        })
        .where({
          id: taskId,
          stopped_at: null,
        });
      void SideEffects.emit('updateTask', {
        id: taskId,
        stopped_at: date,
      });
    },
    async exited(taskId: string, exitCode: number) {
      const date = new Date();
      await getTask()
        .update({
          exited_at: date,
          exit_code: exitCode,
          updated_at: date,
        })
        .where({
          id: taskId,
          exited_at: null,
        });
      void SideEffects.emit('updateTask', {
        id: taskId,
        exited_at: date,
        exit_code: exitCode,
      });
    },
  },

  get(taskId: string) {
    return getTask()
      .select()
      .first()
      .where({
        id: taskId,
      })
      .then((r) => {
        if (r) {
          if (r.service_spec) {
            r.service_spec = JSON.parse(r.service_spec);
          }
        }
        return r as unknown as TaskType;
      });
  },
  list(serviceName: string) {
    return getTask()
      .select()
      .where({
        service_name: serviceName,
      })
      .orderBy('creating_at', 'desc')
      .then((r) => {
        r.forEach((task) => {
          if (task.service_spec) {
            task.service_spec = JSON.parse(task.service_spec);
          }
        });

        return r as unknown as TaskType[];
      });
  },
};

const getTaskLog = () => knex<TaskLogType>('task_logs');
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
    const col = getTaskLog();
    await col.insert({
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

  get(taskId: string) {
    return getTaskLog()
      .select()
      .where({
        task_id: taskId,
      })
      .orderBy('date');
  },
};

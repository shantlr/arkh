import {
  addStaticMethods,
  createCollectionAccessor,
  deserializer,
  serializer,
} from 'src/lib/db';
import { knex } from './knex';
import { MetroSpec, StackSpec, ServiceSpec } from '@shantr/metro-common-types';
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
    getStackNameFromFullName(fullName: string): string {
      return fullName.split('.')[0];
    },
    splitFullName(fullName: string) {
      const [stackName, serviceName] = fullName.split('.');
      return {
        stackName,
        serviceName,
      };
    },
  }
);

const getTask = () =>
  knex<{
    id: string;
    service_name: string;
    service_spec: any;
    runner_id: string;
    creating_at: Date;
    updated_at: Date;
    running_at: Date;
    stopping_at: Date;
    stopped_at: Date;
    exited_at: Date;
    exit_code: number;
  }>(`tasks`);
export const Task = {
  create({
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
    return getTask().insert({
      id,
      service_name: serviceName,
      service_spec: JSON.stringify(serviceSpec),
      runner_id: runnerId,
      creating_at: new Date(),
      updated_at: new Date(),
    });
  },
  update: {
    runningAt(taskId: string) {
      return getTask()
        .update({
          running_at: new Date(),
          updated_at: new Date(),
        })
        .where({
          id: taskId,
          running_at: null,
        });
    },
    stoppingAt(taskId: string) {
      return getTask()
        .update({
          stopping_at: new Date(),
          updated_at: new Date(),
        })
        .where({
          id: taskId,
          stopping_at: null,
        });
    },
    stoppedAt(taskId: string) {
      return getTask()
        .update({
          stopped_at: new Date(),
          updated_at: new Date(),
        })
        .where({
          id: taskId,
          stopped_at: null,
        });
    },
    exited(taskId: string, exitCode: number) {
      return getTask()
        .update({
          exited_at: new Date(),
          exit_code: exitCode,
          updated_at: new Date(),
        })
        .where({
          id: taskId,
          exited_at: null,
        });
    },
  },

  get(taskId: string) {
    return getTask().select().first().where({
      id: taskId,
    });
  },
  list(serviceName: string) {
    return getTask()
      .select()
      .where({
        service_name: serviceName,
      })
      .orderBy('creating_at', 'desc');
  },
};

const getTaskLog = () =>
  knex<{
    out: 0 | 1;
    task_id: string;
    text: string;
    date: Date;
  }>('task_logs');
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

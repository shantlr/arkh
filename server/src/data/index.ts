import { MetroConfig, ServiceConfig, StackConfig } from 'src/events/types';
import { createCollectionAccessor, deserializer, serializer } from 'src/lib/db';
import { knex } from './knex';

export { doMigrations } from './knex';

export const Config = createCollectionAccessor<{
  spec: MetroConfig;
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
  spec: StackConfig;
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
export const Service = createCollectionAccessor<{
  spec: ServiceConfig;
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
});

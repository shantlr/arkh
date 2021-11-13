import { createCollectionAccessor, deserializer, serializer } from 'src/lib/db';
import { knex } from './knex';
import { MetroSpec, StackSpec, ServiceSpec } from '@shantr/metro-common-types';

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
export const Service = createCollectionAccessor<{
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
});

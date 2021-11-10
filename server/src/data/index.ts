import { MetroConfig, ServiceConfig, StackConfig } from 'src/events/types';
import { createCollectionAccessor } from 'src/lib/db';
import { knex } from './knex';

export { doMigrations } from './knex';

export const Config = createCollectionAccessor<{
  spec: MetroConfig;
}>({
  name: 'configs',
  knex,
  mapDoc(doc) {
    return {
      ...doc,
      spec: JSON.parse(doc.spec),
    };
  },
  serializeDoc(doc) {
    const a: any = doc;
    if (doc.spec) {
      a.spec = JSON.stringify(doc.spec);
    }
    return a;
  },
});
export const Stack = createCollectionAccessor<{
  spec: StackConfig;
  to_remove?: boolean;
}>({
  name: 'stacks',
  knex,
  mapDoc: (doc) => {
    return {
      ...doc,
      spec: JSON.parse(doc.spec) as StackConfig,
    };
  },
  serializeDoc: (doc) => {
    const a: any = doc;
    if (doc.spec) {
      // @ts-ignore
      a.spec = JSON.stringify(doc.spec);
    }
    return a;
  },
});
export const Service = createCollectionAccessor<{
  spec: ServiceConfig;
  key: string;
  stack: string;
}>({
  name: 'services',
  knex,
  mapDoc: (doc) => ({
    ...doc,
    spec: JSON.parse(doc.spec),
  }),
  serializeDoc: (doc) => {
    const a: any = doc;
    if (doc.spec) {
      a.spec = JSON.stringify(doc.spec);
    }
    return a;
  },
});

// @ts-ignore
import Loki from 'lokijs';
import LokiFsStructuredAdapter from 'lokijs/src/loki-fs-structured-adapter';

import { config } from 'src/config';
import { ServiceConfig, StackConfig } from 'src/events/types';

const adapter = new LokiFsStructuredAdapter();
export const db = new Loki(config.get('loki.path'), {
  adapter,
  autosave: true,
  autoload: true,
});

export type EntityType = 'config' | 'stack' | 'service';

export type IEntity<T = any, U = any> = {
  key: string;
  type: EntityType;
  name: string;
  spec: T;
  metadata: U;
  created_at: Date;
  updated_at: Date;
};
export type ServiceEntity = IEntity<
  ServiceConfig,
  {
    stack: string;
    name: string;
  }
>;
export type StackEntity = IEntity<StackConfig>;

const entities = db.addCollection<IEntity>('entities', {
  unique: ['key'],
});

export const Entity = {
  key(type: EntityType, name: string) {
    return `${type}:${name}`;
  },
  getOne(type: EntityType, name: string) {
    return entities.by('key', Entity.key(type, name));
  },
  matchMeta(type: EntityType, metadata) {
    return entities.find({
      type,
      metadata,
    });
  },
  insertOne(entity: Omit<IEntity, 'key' | 'created_at' | 'updated_at'>) {
    return entities.insertOne({
      key: Entity.key(entity.type, entity.name),
      created_at: new Date(),
      updated_at: new Date(),
      ...entity,
    });
  },
  updateOne(type: EntityType, name: string, entity) {
    const doc = Entity.getOne(type, name);
    if (!doc) {
      return;
    }
    Object.assign(doc, entity);
    return entities.update(doc);
  },

  removeOne(type: EntityType, name: string) {
    const doc = Entity.getOne(type, name);
    if (doc) {
      entities.remove(doc);
      return doc;
    }
    return null;
  },
};

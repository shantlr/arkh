import { Knex } from 'knex';
import { identity } from 'lodash';

export interface IEntity {
  name: string;
  created_at: Date;
  updated_at: Date;
}

export type StringifyNonScalar<T extends Record<string, any>> = {
  [key in keyof T]: T[key] extends string | number | boolean | Date
    ? T[key]
    : string;
};

export interface EntityAccessor<Deserialized> {
  getOne(name: string): Promise<IEntity & Deserialized>;
  getIn(name: string[]): Promise<(IEntity & Deserialized)[]>;
  getAll(): Promise<(IEntity & Deserialized)[]>;
  find(
    query: Partial<IEntity & Deserialized>
  ): Promise<(IEntity & Deserialized)[]>;
  insertOne(
    entity: Deserialized & { name: string }
  ): Promise<IEntity & Deserialized>;
  updateOne(
    name: string,
    update: Partial<Deserialized>
  ): Promise<IEntity & Deserialized>;
  removeOne(name: string): Promise<IEntity & Deserialized>;
}

export const createCollectionAccessor = <
  DeserializedExtraData extends Record<string, any>,
  // StaticMethods extends Record<string, (...args: any[]) => any>,
  SerializedExtraData extends Record<
    string,
    string | boolean | number
  > = StringifyNonScalar<DeserializedExtraData>
>({
  name: collectionName,
  knex,
  mapDoc = identity,
  serializeDoc = identity,
}: {
  name: string;
  knex: Knex;
  mapDoc?: (
    doc: IEntity & SerializedExtraData
  ) => IEntity & DeserializedExtraData;
  serializeDoc?: (
    doc: Partial<DeserializedExtraData>
  ) => Partial<SerializedExtraData>;
}): EntityAccessor<DeserializedExtraData> => {
  const getCollection = <Type = IEntity & DeserializedExtraData>(t = knex) =>
    t<Type>(collectionName);

  const accessor: EntityAccessor<DeserializedExtraData> = {
    async getOne(name) {
      const res = await getCollection<IEntity>().select().first().where({
        name,
      });
      if (res) {
        return mapDoc(res as IEntity & SerializedExtraData);
      }
      return null;
    },
    async find(query) {
      const res = await getCollection<IEntity>().select().where(query);
      return res.map((i) => mapDoc(i as IEntity & SerializedExtraData));
    },
    async getIn(names) {
      if (!names.length) {
        return [];
      }

      const res = await getCollection<IEntity>()
        .select()
        .whereIn('name', names);
      return res.map((r) => mapDoc(r as IEntity & SerializedExtraData));
    },
    async getAll() {
      const res = (await getCollection<IEntity>().select()) as (IEntity &
        SerializedExtraData)[];
      return res.map((r) => mapDoc(r));
    },
    async insertOne(entity) {
      await getCollection<IEntity>().insert({
        created_at: new Date(),
        updated_at: new Date(),
        name: entity.name,

        ...serializeDoc(entity),
      });
      return accessor.getOne(entity.name);
    },
    async updateOne(name, update) {
      await getCollection<IEntity>().update(serializeDoc(update)).where({
        name,
      });
      return accessor.getOne(name);
    },
    async removeOne(name) {
      const existing = accessor.getOne(name);
      if (existing) {
        await getCollection<IEntity>().delete().where({
          name,
        });
      }
      return existing;
    },
  };

  return accessor;
};
export const addStaticMethods = <
  T,
  StaticMethods extends Record<string, (...args: any[]) => any>
>(
  entityAccessor: EntityAccessor<T>,
  statics: StaticMethods
): EntityAccessor<T> & StaticMethods => {
  return {
    ...statics,
    ...entityAccessor,
  };
};

type NonScalarFields<T, K = keyof T> = K extends keyof T
  ? T[K] extends string | number | boolean | Date
    ? never
    : K
  : never;

type FieldSerializerMap<T> = {
  [key in NonScalarFields<T>]: (value: T[key], doc: T) => string;
};
type Serializer<T, U> = (doc: T) => U;
export const serializer = <T, U>(
  handlers: FieldSerializerMap<T>
): Serializer<T, U> => {
  if (!Object.keys(handlers).length) {
    return identity;
  }
  const keys = Object.keys(handlers);
  return (doc) => {
    const res = { ...doc };

    keys.forEach((key) => {
      res[key] = handlers[key](res[key], res);
    });
    // @ts-ignore
    return res as U;
  };
};

type FieldDeserializerMap<T> = {
  [key in NonScalarFields<T>]: (value: string, doc: T) => T[key];
};
type Deserializer<T, U> = (doc: T) => U;
export const deserializer = <SerializedType, DeserializedType>(
  handlers: FieldDeserializerMap<DeserializedType>
): Deserializer<SerializedType, DeserializedType> => {
  if (!Object.keys(handlers).length) {
    return identity;
  }
  const keys = Object.keys(handlers);
  return (doc) => {
    keys.forEach((key) => {
      doc[key] = handlers[key](doc[key], doc);
    });
    // @ts-ignore
    return doc as T;
  };
};

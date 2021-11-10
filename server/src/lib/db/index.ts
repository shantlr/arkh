import { Knex } from 'knex';
import { identity } from 'lodash';

export interface IEntity {
  name: string;
  created_at: Date;
  updated_at: Date;
}

type StringifyNonScalar<T extends Record<string, any>> = {
  [key in keyof T]: T[key] extends string | number | boolean ? T[key] : string;
};

export interface EntityAccessor<Deserialized> {
  getOne(name: string): Promise<IEntity & Deserialized>;
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
  DeserializedExtraData extends Record<string, any> = Record<string, never>,
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

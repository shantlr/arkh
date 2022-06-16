import { Knex } from 'knex';
import { identity } from 'lodash';

export interface EntityAccessor<DeserializedType, SerializedType> {
  getCollection(t?: Knex): Knex.QueryBuilder<any>;
  getOne(query: Partial<SerializedType>): Promise<DeserializedType>;
  getAll(): Promise<DeserializedType[]>;
  find(query: Partial<SerializedType>): Promise<DeserializedType[]>;
  insertOne(entity: DeserializedType): Promise<void>;
  deserializeDoc?: (doc: SerializedType) => DeserializedType;
  serializeDoc?: (doc: Partial<DeserializedType>) => Partial<SerializedType>;
  updateOne(
    query: Partial<SerializedType>,
    update: Partial<DeserializedType>
  ): Promise<void>;
  remove(query: Partial<SerializedType>): Promise<number>;
}

export const createEntityAccessorBase = <DeserializedType, SerializedType>({
  collectionName,
  knex,
  deserializeDoc = identity,
  serializeDoc = identity,
}: {
  collectionName: string;
  knex: Knex;
  deserializeDoc?: (doc: SerializedType) => DeserializedType;
  serializeDoc?: (doc: Partial<DeserializedType>) => Partial<SerializedType>;
}) => {
  const accessor: EntityAccessor<DeserializedType, SerializedType> = {
    serializeDoc,
    deserializeDoc,
    getCollection(t = knex) {
      return t(collectionName);
    },
    async getOne(query) {
      const col = accessor.getCollection();
      const res = await col.select().where(query).first();
      if (res) {
        return deserializeDoc(res);
      }
      return null;
    },
    async find(query) {
      const res = await accessor.getCollection().select().where(query);
      return res.map((r) => deserializeDoc(r));
    },
    async getAll() {
      return accessor.find({});
    },
    async insertOne(doc) {
      await accessor.getCollection().insert(serializeDoc(doc));
    },
    async updateOne(query, update) {
      await accessor.getCollection().update(serializeDoc(update)).where(query);
    },
    async remove(query) {
      const res = await accessor.getCollection().delete().where(query);
      return res;
    },
  };
  return accessor;
};

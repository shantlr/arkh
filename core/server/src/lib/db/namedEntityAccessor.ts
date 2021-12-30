import { Knex } from 'knex';
import { createEntityAccessorBase } from './entityAccessorBase';

/**
 * map field that are array or object to string
 */
export type StringifyNonScalar<T extends Record<string, any>> = {
  [key in keyof T]: T[key] extends string | number | boolean | Date
    ? T[key]
    : string;
};

export interface NamedEntity {
  name: string;
  created_at: Date;
  updated_at: Date;
}

type P<T extends Record<string, any>> = {
  [key in keyof T]?: T[key];
};

export interface NamedEntityAccessor<
  DeserializedExtraData,
  SerializedExtraData
> {
  getOne(name: string): Promise<NamedEntity & DeserializedExtraData>;
  getIn(names: string[]): Promise<(NamedEntity & DeserializedExtraData)[]>;
  getAll(): Promise<(NamedEntity & DeserializedExtraData)[]>;
  find(
    query: Partial<NamedEntity & SerializedExtraData>
  ): Promise<(NamedEntity & DeserializedExtraData)[]>;
  insertOne(doc: DeserializedExtraData & { name: string }): Promise<void>;
  updateOne(
    name: string,
    update: Partial<DeserializedExtraData>
  ): Promise<void>;
  removeOne(name: string): Promise<number>;
}

export const createNamedEntityAccessor = <
  DeserializedExtraData extends Record<string, any>,
  SerializedExtraData extends Record<
    string,
    string | boolean | number
  > = StringifyNonScalar<DeserializedExtraData>
>({
  knex,
  collectionName,
  deserializeDoc,
  serializeDoc,
}: {
  knex: Knex;
  collectionName: string;
  deserializeDoc?: (
    doc: NamedEntity & SerializedExtraData
  ) => NamedEntity & DeserializedExtraData;
  serializeDoc?: (
    doc: Partial<NamedEntity & DeserializedExtraData>
  ) => Partial<NamedEntity & SerializedExtraData>;
}) => {
  const accessorBase = createEntityAccessorBase<
    NamedEntity & DeserializedExtraData,
    NamedEntity & SerializedExtraData
  >({
    collectionName,
    knex,
    deserializeDoc,
    serializeDoc,
  });

  const accessor: NamedEntityAccessor<
    DeserializedExtraData,
    SerializedExtraData
  > = {
    getOne(name: string) {
      return accessorBase.getOne(
        // @ts-ignore
        { name }
      );
    },
    async getIn(names) {
      const res = await accessorBase
        .getCollection()
        .select()
        .whereIn('name', names);
      return res.map((r) => deserializeDoc(r));
    },
    getAll() {
      return accessorBase.getAll();
    },
    find(query) {
      return accessorBase.find(query);
    },
    insertOne(doc) {
      return accessorBase.insertOne({
        ...doc,
        created_at: new Date(),
        updated_at: new Date(),
        name: doc.name,
      });
    },
    updateOne(name, doc) {
      return accessorBase.updateOne(
        // @ts-ignore
        { name },
        {
          ...doc,
          updated_at: new Date(),
        }
      );
    },
    removeOne(name) {
      return accessorBase.remove(
        // @ts-ignore
        { name }
      );
    },
  };
  return accessor;
};

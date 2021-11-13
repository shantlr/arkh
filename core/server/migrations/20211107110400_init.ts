import { Knex } from 'knex';

exports.up = async (knex: Knex) => {
  await knex.transaction(async (t) => {
    await t.raw(`
      CREATE TABLE configs (
        name text NOT NULL PRIMARY KEY,
        spec text NOT NULL,

        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
    `);
    await t.raw(`
      CREATE TABLE stacks (
        name text NOT NULL PRIMARY KEY,
        spec text NOT NULL,

        to_remove boolean,

        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
    `);
    await t.raw(`
      CREATE TABLE services (
        name text NOT NULL PRIMARY KEY,
        key text NOT NULL,
        stack text NOT NULL,
        spec text NOT NULL,

        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
    `);
  });
};
exports.down = async (knex: Knex) => {
  await knex.transaction(async (t) => {
    await t.raw(`DROP TABLE configs`);
    await t.raw(`DROP TABLE stacks`);
    await t.raw(`DROP TABLE services`);
  });
};

import { Knex } from 'knex';

export const up = async (knex: Knex) => {
  await knex.transaction(async (t) => {
    await t.raw(`
      CREATE TABLE stack_tabs (
        stack text PRIMARY KEY NOT NULL,
        tabs text NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
    `);
  });
};
export const down = async (knex: Knex) => {
  await knex.transaction(async (t) => {});
};

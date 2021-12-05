import { Knex } from 'knex';

export const up = async (knex: Knex) => {
  await knex.transaction(async (t) => {
    await t.raw(`
      CREATE TABLE tasks (
        id text PRIMARY KEY NOT NULL,
        service_spec text NOT NULL,
        service_name text NOT NULL,

        runner_id text NOT NULL,

        creating_at timestamptz NOT NULL,
        running_at timestamptz,
        exited_at timestamptz,
        exit_code integer,

        stopping_at timestamptz,
        stopped_at timestamptz,

        updated_at timestamptz NOT NULL
      );
    `);

    await t.raw(`
      CREATE TABLE task_logs (
        out integer NOT NULL,
        task_id text NOT NULL,
        text text NOT NULL,
        date timestamptz NOT NULL
      );
    `);
  });
};
export const down = async (knex: Knex) => {
  await knex.transaction(async (t) => {
    await t.raw(`
      DROP TABLE IF EXISTS tasks;
    `);

    await t.raw(`
      DROP TABLE IF EXISTS task_logs;
    `);
  });
};

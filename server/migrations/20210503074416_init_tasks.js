exports.up = function (knex) {
  return knex.transaction(async (t) => {
    await t.raw(`
      CREATE TABLE "tasks" (
        id text NOT NULL PRIMARY KEY,
        command_id text NOT NULL,

        result text,

        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,

        started_at timestamptz,
        ended_at timestamptz
      );
    `);
    await t.raw(`
      CREATE TABLE "task_logs" (
        id text NOT NULL PRIMARY KEY,
        task_id text NOT NULL REFERENCES tasks (id),
        level integer NOT NULL,
        log text NOT NULL,
        date timestamptz NOT NULL
      );
    `);
  });
};

exports.down = function (knex) {
  return knex.transaction(async (t) => {
    await t.raw(`
      DROP TABLE "tasks";
    `);
    await t.raw(`
      DROP TABLE "task_logs";
    `);
  });
};

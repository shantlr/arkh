exports.up = async (knex) => {
  await knex.transaction(async (t) => {
    await t.raw(`
      CREATE TABLE commands (
        id text NOT NULL PRIMARY KEY,
        name text NOT NULL,
        template_id text NOT NULL,
        config text NOT NULL,
        created_at timestamptz,
        updated_at timestamptz,
        deleted_at timestamptz
      );
    `);
    await t.raw(`
      CREATE TABLE command_templates (
        id text NOT NULL PRIMARY KEY,
        name text NOT NULL,
        config text NOT NULL,
        created_at timestamptz,
        updated_at timestamptz,
        deleted_at timestamptz
      );
    `);
  });
};

exports.down = async function (knex) {
  await knex.transaction(async (t) => {
    await t.raw(`
      DROP TABLE command_templates;
    `);
    await t.raw(`
      DROP TABLE commands;
    `);
  });
};

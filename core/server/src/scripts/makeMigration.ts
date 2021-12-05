import path from 'path';
import { knex } from 'src/data/knex';

const main = async (): Promise<void> => {
  const migrationName = process.argv[2];
  if (!migrationName) {
    console.error('missing migration name');
    console.error(`Usage: yarn migrate:make <name>`);
    process.exit(1);
  }

  await knex.migrate.make(migrationName, {
    stub: path.resolve(__dirname, 'migrationStub.ts'),
    extension: 'ts',
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { knex } from 'src/data/knex';

const main = async (): Promise<void> => {
  const res = await knex.migrate.down({});
  console.log(res);
  await knex.destroy();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

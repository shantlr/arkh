import Knex from 'knex';
import { baseLogger, config } from '../config';

export const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: config.get('db.path'),
  },
});

export const doMigrations = async () => {
  const logger = baseLogger.extend('migration');
  logger.info('starting knex migration');
  const [from, migrateds] = await knex.migrate.latest({
    loadExtensions: ['.ts', 'js'],
  });
  if (migrateds.length) {
    logger.info(`migration done: ${migrateds.join(', ')}`);
  } else {
    logger.info(`migrations already up to date`);
  }
  logger.info('knex migrations done');
};

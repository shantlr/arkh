import { Knex } from 'knex';

export const up = async (knex: Knex) => {
  await knex.transaction(async (t) => {});
};
export const down = async (knex: Knex) => {
  await knex.transaction(async (t) => {});
};

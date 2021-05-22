import { composeReducer, initState } from 'compose-reducer';
import { cacheReducer } from 'lib/cache';

export const reducer = composeReducer(
  initState({
    cache: {},
  }),
  cacheReducer
);

import { all, call, put, select, takeEvery } from '@redux-saga/core/effects';
import {
  cacheQueryError,
  cacheQueryStarted,
  cacheQuerySuccess,
  CACHE_QUERY_START,
} from './actions';
import { selectQueryIsLoading } from './selectors';

/**
 *
 * @param {Object<string, (input: { key: string, params: any }) => Promise<{ path: string[], value: any }[]>>} queryHandlerMap
 * @returns
 */
const querySaga = (queryHandlerMap) =>
  function* querySaga(action) {
    const { key, params } = action;

    const isLoading = yield select((state) =>
      selectQueryIsLoading(state, key, params)
    );

    if (isLoading) {
      // Query already ongoing
      return;
    }

    // Mark query state as started
    yield put(cacheQueryStarted({ key, params }));

    const fetchHandler = queryHandlerMap[key];

    // Assert handler is correct
    if (typeof fetchHandler !== 'function') {
      console.warn(`[query-saga] '${key}' handler not found`);
      yield put(
        cacheQueryError({
          key,
          params,
          error: {
            message: `Handler for '${key}' not found`,
          },
        })
      );
      return;
    }

    // Call query handler
    try {
      const result = yield call(fetchHandler, {
        key,
        params,
      });

      // Mark success
      yield put(
        cacheQuerySuccess({
          key,
          params,
          result,
        })
      );
    } catch (err) {
      // Mark error
      yield put(
        cacheQueryError({
          key,
          params,
          error: {
            message: err.message,
            code: err.code,
            stack: err.stack,
          },
        })
      );
    }
  };

/**
 *
 * @param {Object} input
 * @param {Object<string, (input: { key: string, params: any })>} input.queryHandlers
 * @returns
 */
export function* cacheSaga({ queryHandlers, reducers }) {
  yield all([takeEvery(CACHE_QUERY_START, querySaga(queryHandlers))]);
}

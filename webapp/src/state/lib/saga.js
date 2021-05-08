import { call, put, select, takeEvery } from '@redux-saga/core/effects';
import { nanoid } from 'nanoid';
import {
  queryError,
  queryStarted,
  querySuccess,
  QUERY_START,
} from 'state/action';

import { selectQueryKey } from 'state/selector';
import { hashParams, QUERY_TYPE } from './key';

export const createQuerySaga = (queryHandlerMap) => {
  function* querySaga(action) {
    const { key, params } = action;
    const value = yield select((state) =>
      selectQueryKey(state, [QUERY_TYPE, key, hashParams(params)])
    );

    if (value && value.isLoading) {
      // Query already ongoing
      return;
    }
    const queryId = nanoid();

    if (!value || !value.isLoading) {
      yield put(queryStarted({ queryId, key, params }));
    }

    const fetchHandler = queryHandlerMap[key];
    if (typeof fetchHandler !== 'function') {
      console.warn(`[query-saga] '${key}' handler not found`);
      yield put(
        queryError({
          key,
          params,
          error: {
            message: `Handler for '${key}' not found`,
          },
        })
      );
      return;
    }

    const result = yield call(fetchHandler, {
      key,
      params,
    });

    yield put(
      querySuccess({
        key,
        params,
        result,
      })
    );
  }

  return takeEvery(QUERY_START, querySaga);
};

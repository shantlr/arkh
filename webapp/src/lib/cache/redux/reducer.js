import {
  at,
  branchAction,
  composable,
  getAction,
  mapAction,
  mapActions,
  mergeValue,
  setValue,
  unsetValue,
} from 'compose-reducer';
import { isNil, isPlainObject } from 'lodash';
import {
  CACHE_QUERY_ERROR,
  CACHE_INVALIDATE_QUERY,
  CACHE_QUERY_STARTED,
  CACHE_QUERY_SUCCESS,
  CACHE_UPDATE,
} from './actions';
import { getQueryPath } from './utils';

export const cacheReducer = branchAction({
  [CACHE_QUERY_STARTED]: composable(
    setValue(
      (state, { key, params }) => getQueryPath(key, params, 'isLoading'),
      true
    )
  ),
  [CACHE_QUERY_ERROR]: composable(
    at(
      (state, { key, params }) => getQueryPath(key, params),

      mergeValue('', {
        isLoading: false,
      }),
      setValue('error', getAction('error'))
    )
  ),
  [CACHE_QUERY_SUCCESS]: composable(
    mergeValue((state, { key, params }) => getQueryPath(key, params), {
      isLoading: false,
      error: null,
      isInvalidated: false,
    }),
    mapActions(
      (state, action) => action.result,
      mergeValue((state, action) => action.path, getAction('value'))
    )
  ),
  [CACHE_UPDATE]: composable(
    mapAction(
      (state, action) => ({
        type: isNil(action)
          ? 'delete'
          : isPlainObject(action.value)
          ? 'merge'
          : 'set',
        path: action.path,
        value: action.value,
      }),
      branchAction({
        merge: mergeValue(getAction('path'), getAction('value')),
        delete: unsetValue(getAction('path')),
        set: setValue(getAction('path'), getAction('value')),
      })
    )
  ),
  [CACHE_INVALIDATE_QUERY]: composable(
    setValue(
      (state, { key, params }) => getQueryPath(key, params, 'isInvalidated'),
      true
    )
  ),
});

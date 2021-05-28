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
  CACHE_REDUCER_ACTION,
} from './actions';
import { selectCacheValue } from './selectors';
import { getQueryStatePath } from './utils';

const callWithAction = (trackingState, reducer, action) => {
  return mapAction(() => action, reducer)(trackingState);
};

/**
 *
 * @param {Object} input
 * @param {{ [key: string]:
 * (
 *  dataAccessor: {
 *     get(key: string, params: any) => any,
 *     getQuery(key: string, params: any) => any,
 *     update: (ops: any[]) => void,
 *  },
 *  payload: any
 * ) => void }} input.reducers
 * @returns
 */
export const cacheReducer = ({ reducers = {} } = {}) => {
  const applyUpdateOp = mapAction(
    (state, action) => ({
      type: isNil(action.value)
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
  );

  return branchAction({
    [CACHE_QUERY_STARTED]: composable(
      setValue(
        (state, { key, params }) => getQueryStatePath(key, params, 'isLoading'),
        true
      )
    ),
    [CACHE_QUERY_ERROR]: composable(
      at(
        (state, { key, params }) => getQueryStatePath(key, params),

        mergeValue('', {
          isLoading: false,
        }),
        setValue('error', getAction('error'))
      )
    ),
    [CACHE_QUERY_SUCCESS]: composable(
      mergeValue((state, { key, params }) => getQueryStatePath(key, params), {
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
      mapActions((state, action) => action.ops, applyUpdateOp)
    ),
    [CACHE_INVALIDATE_QUERY]: composable(
      setValue(
        (state, { key, params }) =>
          getQueryStatePath(key, params, 'isInvalidated'),
        true
      )
    ),
    [CACHE_REDUCER_ACTION]: (trackingState) => {
      const { actionType, payload } = trackingState.action;

      const reducer = reducers[actionType];
      if (typeof reducer !== 'function') {
        console.warn(`Missing reducer for actionType '${actionType}'`);
        return;
      }

      const cacheAccessor = {
        getState() {
          return trackingState.nextState;
        },
        get(key, params) {
          const state = trackingState.nextState;
          return selectCacheValue(state, key, params);
        },
        // getQuery(key, params) {
        //   const state = trackingState.nextState;
        //   return selectQueryValue(state, key, params);
        // },
        update(ops) {
          if (Array.isArray(ops)) {
            ops.forEach((op) => {
              callWithAction(trackingState, applyUpdateOp, op);
            });
          } else if (ops) {
            callWithAction(trackingState, applyUpdateOp, ops);
          }
        },
      };

      reducer(cacheAccessor, payload);
    },
  });
};

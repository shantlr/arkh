import {
  branchAction,
  composable,
  composeReducer,
  getAction,
  setValue,
} from 'compose-reducer';
import { get } from 'lodash-es';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import {
  cacheInvalidateQuery,
  cacheStartQuery,
  cacheUpdate,
  cacheReducerAction,
} from '../redux';
import { createSelectData } from '../redux/selectors';
import {
  getCachePath,
  getQueryStatePath,
  getQueryStatePathUsingHash,
  hashParams,
} from '../redux/utils';

/**
 * Get cache accessor object
 */
export const useCacheAccessor = () => {
  const store = useStore();

  return useMemo(
    () => ({
      get(key, params) {
        const state = store.getState();
        return get(state, getCachePath(key, params));
      },
      getQuery(key, params) {
        const state = store.getState();
        return get(state, getQueryStatePath(key, params));
      },
      dispatch(actionType, payload) {
        store.dispatch(cacheReducerAction(actionType, payload));
      },
      /**
       * @param {string} key
       * @param {any} params
       * @param {any} value
       */
      updateKey(key, params, value) {
        store.dispatch(
          cacheUpdate([
            {
              path: getCachePath(key, params),
              value,
            },
          ])
        );
      },
      updateData(data) {
        // store.dispatch();
      },
      /**
       * @param {string} key
       * @param {any} params
       */
      invalidateQuery(key, params) {
        store.dispatch(
          cacheInvalidateQuery({
            key,
            params,
          })
        );
      },
    }),
    [store]
  );
};

/**
 *
 * @param {string} key
 * @param {any} params
 * @param {Object} [option]
 * @param {'value'|'raw'|'join'} [option.format]
 * @returns
 */
export const useCacheValue = (key, params, { format = 'value' } = {}) => {
  const paramsHash = useMemo(() => hashParams(params), [params]);

  const selectData = useMemo(
    () => createSelectData(key, paramsHash, { format }),
    [key, paramsHash, format]
  );

  return useSelector(selectData);
};

/**
 *
 * @param {Object} input
 * @param {string} input.key
 * @param {any} input.params
 * @param {'value'|'raw'|'join'} input.format
 * @returns
 */
export const useQuery = ({ key, params, format = 'value' }) => {
  const paramsHash = hashParams(params);

  const queryState = useSelector(
    useCallback(
      (state) => get(state, getQueryStatePathUsingHash(key, paramsHash)),
      [key, paramsHash]
    )
  );

  const selectData = useMemo(
    () => createSelectData(key, paramsHash, { format }),
    [key, paramsHash, format]
  );
  const data = useSelector(selectData);

  const dispatch = useDispatch();

  const shouldStartQuery = !queryState || queryState.isInvalidated;

  useEffect(() => {
    // Start query only if no value or invalidated
    if (shouldStartQuery) {
      dispatch(
        cacheStartQuery({
          key,
          params,
        })
      );
    }
  }, [shouldStartQuery, key, paramsHash, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    error: queryState ? queryState.error : null,
    isLoading: queryState ? queryState.isLoading : true,
    data,
  };
};

const mutationStateReducer = composeReducer(
  branchAction({
    STARTED: setValue('isLoading', true),
    SUCCESS: composable(setValue('isLoading', false), setValue('error', null)),
    ERROR: composable(
      setValue('isLoading', false),
      setValue('error', getAction('error'))
    ),
  })
);
export const useMutation = (key, fetcher, callbacks) => {
  const [state, dispatchLocal] = useReducer(mutationStateReducer, null);

  const dataCache = useCacheAccessor();
  const ref = useRef();
  ref.current = { key, callbacks };

  return [
    useCallback(
      async (params, afterCallbacks) => {
        try {
          dispatchLocal({
            type: 'STARTED',
          });

          // fetch data
          const result = await fetcher(params);

          let k = ref.current.key;
          let p = params;

          // Compute key if dynamic
          if (typeof k === 'function') {
            const computed = k(params, result);
            k = computed[0];
            p = computed[1];
          }

          if (k !== null) {
            dataCache.updateKey(k, p, result);
          }
          dispatchLocal({
            type: 'SUCCESS',
          });

          // Success callback
          if (ref.current.callbacks && ref.current.callbacks.onSuccess) {
            ref.current.callbacks.onSuccess({ params, result, dataCache });
          }
          if (afterCallbacks && afterCallbacks.onSuccess) {
            afterCallbacks.onSuccess({ params, result, dataCache });
          }
        } catch (err) {
          dispatchLocal({
            type: 'ERROR',
            error: err,
          });

          // Error callback
          if (ref.current.callbacks && ref.current.callbacks.onError) {
            ref.current.callbacks.onError(err, { params });
          }
          if (afterCallbacks && afterCallbacks.onError) {
            afterCallbacks.onError(err, { params });
          }
        } finally {
          // Success callback
          if (ref.current.callbacks && ref.current.callbacks.onFinally) {
            ref.current.callbacks.onFinally(params);
          }
          if (afterCallbacks && afterCallbacks.onFinally) {
            afterCallbacks.onFinally(params);
          }
        }
      },
      [fetcher, dataCache]
    ),
    state,
  ];
};

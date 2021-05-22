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
import { createSelector } from 'reselect';

import {
  cacheInvalidateQuery,
  cacheStartQuery,
  cacheUpdate,
  getQueryPath,
  selectQueryValue,
  selectCacheValue,
  selectCacheMappedData,
} from '../redux';
import {
  getCachePath,
  getCachePathUsingHash,
  getQueryPathUsingHash,
  hashParams,
  isNormalizedArray,
  isRefValue,
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
        return selectCacheValue(state, getCachePath(key, params));
      },
      getQuery(key, params) {
        const state = store.getState();
        return selectQueryValue(state, getQueryPath(key, params));
      },
      /**
       * @param {string} key
       * @param {any} params
       * @param {any} value
       */
      updateKey(key, params, value) {
        store.dispatch(
          cacheUpdate({
            path: getCachePath(key, params),
            value,
          })
        );
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

export const useCacheValue = (key, params) => {
  const paramHash = useMemo(() => hashParams(params), [params]);

  return useSelector(
    useCallback((state) => selectCacheValue(state, [key, paramHash]), [
      key,
      paramHash,
    ])
  );
};

export const useQuery = ({
  key,
  params,
  withMappedData = false,
  withOptimistic = false,
}) => {
  const paramsHash = hashParams(params);

  const queryState = useSelector(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback((state) => get(state, getQueryPathUsingHash(key, paramsHash)), [
      key,
      paramsHash,
    ])
  );

  const selectData = useMemo(
    () =>
      createSelector(
        (state) => get(state, getQueryPathUsingHash(key, paramsHash, 'data')),
        (state) => {
          if (!withMappedData) {
            return null;
          }
          const data = get(
            state,
            getQueryPathUsingHash(key, paramsHash, 'data')
          );
          if (isRefValue(data)) {
            return get(state, getCachePath(data.key, data.params));
          }
          if (isNormalizedArray(data)) {
            return data.value.map((params) =>
              get(state, getCachePath(data.itemKey, params))
            );
          }
          return null;
        },
        (state) =>
          withOptimistic
            ? selectCacheMappedData(
                state,
                getCachePathUsingHash(key, paramsHash)
              )
            : null,
        (queryData, deps, optimistic) => {
          if (!queryData) {
            return optimistic;
          }
          if (!withMappedData) {
            if (isNormalizedArray(queryData)) {
              return queryData.value;
            }
            if (isRefValue(queryData)) {
              return queryData.value;
            }
            return queryData;
          }

          if (isRefValue(queryData)) {
            return deps;
          }
          if (isNormalizedArray(queryData)) {
            return queryData.value;
          }

          return queryData;
        }
      ),
    [withOptimistic, withMappedData, key, paramsHash]
  );
  const value = useSelector(selectData);

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
    isLoading: queryState ? queryState.isLoading : true,
    data: value,
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

          dataCache.updateKey(k, p, result);
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

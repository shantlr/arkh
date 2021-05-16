import {
  branchAction,
  composable,
  composeReducer,
  getAction,
  setValue,
} from 'compose-reducer';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { queryStart } from 'state';
import { queryInvalidateQuery, queryUpdateCache } from 'state/action';
import { selectCacheValue, selectQueryKey } from 'state/selector';
import { hashParams, QUERY_TYPE } from './key';

export const useDataCache = () => {
  const store = useStore();

  return useMemo(
    () => ({
      /**
       * @param {string} key
       * @param {any} params
       * @param {any} value
       */
      updateKey(key, params, value) {
        store.dispatch(
          queryUpdateCache({
            path: [key, hashParams(params)],
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
          queryInvalidateQuery({
            key,
            params,
          })
        );
      },
    }),
    [store]
  );
};

export const useCache = (key, params) => {
  const paramHash = useMemo(() => hashParams(params), [params]);
  return useSelector(
    useCallback((state) => selectCacheValue(state, [key, paramHash]), [
      key,
      paramHash,
    ])
  );
};

export const useQuery = ({ key, params, debug = false }) => {
  const paramHash = hashParams(params);
  const value = useSelector(
    useCallback(
      (state) => selectQueryKey(state, [QUERY_TYPE, key, paramHash]),
      [key, paramHash]
    )
  );

  const optimistic = useSelector(
    useCallback((state) => selectQueryKey(state, [key, paramHash]), [
      key,
      paramHash,
    ])
  );
  const dispatch = useDispatch();

  useEffect(() => {
    // Start query only if no value or invalidated
    if (!value || value.isInvalidated) {
      dispatch(
        queryStart({
          key,
          params,
        })
      );
    }
  }, [value, key, paramHash, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoading: value ? value.isLoading : true,
    data:
      value && value.data ? value.data : optimistic ? optimistic.data : null,
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

  const dataCache = useDataCache();
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

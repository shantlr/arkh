import { get } from 'lodash';
import {
  getCachePath,
  getQueryPath,
  isNormalizedArray,
  isRefValue,
} from './utils';

export const mapData = (state, value) => {
  if (isNormalizedArray(value)) {
    const normalizedArray = value;

    return normalizedArray.value.map((id) =>
      get(state, getCachePath(normalizedArray.itemKey, id))
    );
  }
  if (isRefValue(value)) {
    const ref = value;
    return get(state, getCachePath(ref.key, ref.params));
  }

  return value;
};

export const selectCacheValue = (state, path) => {};
export const selectCacheMappedData = (state, path) => {
  const value = get(state, path);
  return mapData(state, value);
};

export const selectQueryIsLoading = (state, key, params) => {
  const queryState = get(state, getQueryPath(key, params));
  if (!queryState) {
    return null;
  }
  return queryState.isLoading;
};

export const selectQueryValue = (state, key, params) =>
  get(state, getQueryPath(key, params));

// export const selectQueryState = (state, key, params) => {
//   const queryState = get(state, getQueryPath(key, params));
//   if (!queryState) {
//     return null;
//   }

//   return {
//     isLoading: queryState.isLoading,
//     value: mapData(state, queryState.data),
//     error: queryState.error,
//     isInvalidated: queryState.isInvalidated,
//   };
// };

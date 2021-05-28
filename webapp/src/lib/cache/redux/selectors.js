import { get } from 'lodash';
import {
  getCachePath,
  getCachePathUsingHash,
  getQueryStatePath,
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

export const selectCacheMappedData = (state, path) => {
  const value = get(state, path);
  return mapData(state, value);
};

export const selectQueryIsLoading = (state, key, params) => {
  const queryState = get(state, getQueryStatePath(key, params));
  if (!queryState) {
    return null;
  }
  return queryState.isLoading;
};

export const selectCacheValue = (state, key, params) =>
  get(state, getCachePath(key, params));

/**
 *
 * @param {string} key
 * @param {string} paramsHash
 * @param {Object} [options]
 * @param {'value'|'raw'|'join'} [options.format]
 * @returns
 */
export const createSelectData = (
  key,
  paramsHash,
  { format = 'value' } = {}
) => {
  const dataPath = getCachePathUsingHash(key, paramsHash);

  let prevDeps = [];
  let prevRes = null;

  // const selectRecur = () => {};
  return (state) => {
    const data = get(state, dataPath);

    if (format === 'raw') {
      // data as is
      if (data !== prevRes) {
        prevRes = data;
        prevDeps = [];
      }
      return prevRes;
    } else if (format === 'value') {
      // if is normalized object => value instead of normalized object
      let value = data;
      if (isRefValue(data)) {
        value = data.params;
      } else if (isNormalizedArray(data)) {
        value = data.value;
      }

      if (value !== prevRes) {
        prevRes = value;
        prevDeps = [];
      }
      return prevRes;
    } else if (format === 'join') {
      return data;
    }

    return null;
  };
};

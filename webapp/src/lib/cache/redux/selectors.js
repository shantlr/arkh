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
const selectActualRefData = (state, dataRef) => {
  return get(state, getCachePath(dataRef.key, dataRef.params));
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
export const selectQueryState = (state, key, params) =>
  get(state, getQueryStatePath(key, params));

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
  let prevValue = null;

  const selectJoin = (state, data) => {
    const deps = [];
    let resolvedData = data;

    if (isRefValue(data)) {
      resolvedData = selectActualRefData(state, data);
      deps.push(resolvedData);
    }

    return [deps, resolvedData];
  };

  const isSameDeps = (deps, prevDeps) => {
    if (deps.length !== prevDeps) {
      return false;
    }

    return deps.some((depValue, index) => {
      const prevDepValue = prevDeps[index];
      return depValue === prevDepValue;
    });
  };

  return (state) => {
    const data = get(state, dataPath);

    if (format === 'raw') {
      // data as is
      if (data !== prevValue) {
        prevValue = data;
        prevDeps = [];
      }
      return prevValue;
    } else if (format === 'value') {
      // if is normalized object => value instead of normalized object
      let value = data;
      if (isRefValue(data)) {
        value = data.params;
      } else if (isNormalizedArray(data)) {
        value = data.value;
      }

      if (value !== prevValue) {
        prevValue = value;
        prevDeps = [];
      }
      return prevValue;
    } else if (format === 'join') {
      const [deps, value] = selectJoin(state, data);

      if (value !== prevValue && !isSameDeps(deps, prevDeps)) {
        prevDeps = deps;
        prevValue = value;
      }

      return prevValue;
    }

    return null;
  };
};

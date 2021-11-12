import { map } from 'lodash';
import objHash from 'object-hash';

const CACHE_FIELDS = {
  CONTAINER: 'cache',
  QUERY: '@query',

  DATA: {
    TYPE: '@q/type',
    TYPES: {
      NORMALIZED_ARRAY: '@q/array',
      REF: '@q/ref',
    },
  },

  PARAMS: {
    EMPTY: '@q/no-params',
  },
};

export const hashParams = (params) => {
  if (params === undefined || params === null) {
    return CACHE_FIELDS.PARAMS.EMPTY;
  }
  if (typeof params === 'string') {
    return params;
  }
  return objHash(params);
};

export const getQueryStatePathUsingHash = (key, paramsHash, ...fields) => [
  CACHE_FIELDS.CONTAINER,
  CACHE_FIELDS.QUERY,
  key,
  paramsHash,
  ...fields,
];
export const getQueryStatePath = (key, params, ...fields) =>
  getQueryStatePathUsingHash(key, hashParams(params), ...fields);

export const getCachePathUsingHash = (key, paramsHash, ...fields) => [
  CACHE_FIELDS.CONTAINER,
  key,
  paramsHash,
  ...fields,
];
export const getCachePath = (key, params, ...fields) =>
  getCachePathUsingHash(key, hashParams(params), ...fields);

export const isNormalizedArray = (data) => {
  return (
    Boolean(data) &&
    typeof data === 'object' &&
    data[CACHE_FIELDS.DATA.TYPE] === CACHE_FIELDS.DATA.TYPES.NORMALIZED_ARRAY
  );
};
export const isRefValue = (data) => {
  return (
    Boolean(data) &&
    typeof data === 'object' &&
    data[CACHE_FIELDS.DATA.TYPE] === CACHE_FIELDS.DATA.TYPES.REF
  );
};

export const mapQueryData = (data) => {
  if (isNormalizedArray(data)) {
    return data.value;
  }
  if (isRefValue(data)) {
    return data.value;
  }
  return data;
};

const createDataRef = (key, params) => ({
  [CACHE_FIELDS.DATA.TYPE]: CACHE_FIELDS.DATA.TYPES.REF,
  key,
  params,
});

export const opNormalized = ({
  key,
  itemKey,
  params,
  value,
  getId = (item) => item.id,
}) => [
  {
    path: getCachePath(key, params),
    value: {
      [CACHE_FIELDS.DATA.TYPE]: CACHE_FIELDS.DATA.TYPES.NORMALIZED_ARRAY,
      itemKey,
      value: map(value, getId),
    },
  },
  ...map(value, (item, index) => ({
    path: getCachePath(itemKey, getId(item, index)),
    value: item,
  })),
];

export const normalizedQuerySingleResult = ({
  key,
  queryKey = key,
  params,
  value,
  getId = (item) => item.id,
}) => {
  const res = [opBase(key, getId(value), value)];
  if (queryKey !== key) {
    res.push(opRef(queryKey, params, key, getId(value)));
  }
  return res;
};
export const normalizedQueryArrayResult = ({
  key,
  params,
  itemKey,
  value,
  getId = (item) => item.id,
}) => {
  const results = [
    {
      path: getCachePath(key, params),
      value: {
        [CACHE_FIELDS.DATA.TYPE]: CACHE_FIELDS.DATA.TYPES.NORMALIZED_ARRAY,
        itemKey,
        value: map(value, getId),
      },
    },
    ...map(value, (item, index) => opBase(itemKey, getId(item, index), item)),
  ];

  return results;
};

/**
 *
 * @param {string} key
 * @param {any} params
 * @returns
 */
export const opRef = (key, params, targetKey, targetParams) => ({
  path: getCachePath(key, params),
  value: createDataRef(targetKey, targetParams),
});

/**
 * @param {string} key
 * @param {any} params
 * @param {any} value
 * @returns
 */
export const opBase = (key, params, value) => ({
  path: getCachePath(key, params),
  value,
});

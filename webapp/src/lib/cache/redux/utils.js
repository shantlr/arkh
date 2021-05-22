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

export const getQueryPathUsingHash = (key, paramsHash, ...fields) => [
  CACHE_FIELDS.CONTAINER,
  CACHE_FIELDS.QUERY,
  key,
  paramsHash,
  ...fields,
];
export const getQueryPath = (key, params, ...fields) =>
  getQueryPathUsingHash(key, hashParams(params), ...fields);

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

export const normalizedQuerySingleResult = ({
  key,
  params,
  value,
  getId = (item) => item.id,
}) => [
  {
    path: getQueryPath(key, params, 'data'),
    value: {
      [CACHE_FIELDS.DATA.TYPE]: CACHE_FIELDS.DATA.TYPES.REF,
      key,
      params: getId(value),
    },
  },
  {
    path: getCachePath(key, getId(value)),
    value,
  },
];
export const normalizedQueryArrayResult = ({
  key,
  params,
  itemKey,
  value,
  getId = (item) => item.id,
}) => {
  const results = [
    {
      path: getQueryPath(key, params, 'data'),
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

  return results;
};

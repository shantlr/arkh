import objHash from 'object-hash';

export const QUERY_TYPE = '@query';
export const Q_EMPTY_PARAMS = '@q/no-params';

export const Q_TYPE_KEY = '@q/type';
export const Q_TYPE_ITEM_REF = 'ref';
export const Q_TYPE_NORMALIZED_ARRAY = 'normalized_array';

export const hashParams = (params) => {
  if (params === undefined || params === null) {
    return Q_EMPTY_PARAMS;
  }
  if (typeof params === 'string') {
    return params;
  }
  return objHash(params);
};

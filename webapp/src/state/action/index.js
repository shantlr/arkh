export const QUERY_START = 'QUERY_START';
export const QUERY_STARTED = 'QUERY_STARTED';
export const QUERY_ERROR = 'QUERY_ERROR';
export const QUERY_SUCCESS = 'QUERY_SUCCESS';

export const QUERY_UPDATE_CACHE = 'QUERY_UPDATE_CACHE';
export const QUERY_INVALIDATE_QUERY = 'QUERY_INVALIDATE_QUERY';

export const queryStart = ({ key, params }) => ({
  type: QUERY_START,
  key,
  params,
});
export const queryStarted = ({ queryId, key, params }) => ({
  type: QUERY_STARTED,
  queryId,
  key,
  params,
});
export const querySuccess = ({ key, params, result }) => ({
  type: QUERY_SUCCESS,
  key,
  params,
  result,
});
export const queryError = ({ key, params, error }) => ({
  type: QUERY_ERROR,
  key,
  params,
  error,
});

export const queryUpdateCache = ({ path, value }) => ({
  type: QUERY_UPDATE_CACHE,
  path,
  value,
});
export const queryInvalidateQuery = ({ key, params }) => ({
  type: QUERY_INVALIDATE_QUERY,
  key,
  params,
});

export const QUERIES = {
  templates: () => 'templates',
  template: () => 'template',
};

import { get } from 'lodash-es';
import { hashParams, isNormalizedArray, isRefValue } from 'state/lib';

export const selectTemplates = (state) =>
  state.templates.ids.map((id) => state.templates.docs[id]);

export const selectTemplate = (state, id) => state.templates.docs[id];

export const selectCacheValue = (state, path) => {
  return get(state.data, path);
};

export const selectQueryKey = (state, path) => {
  const container = state.data;

  const value = get(container, path);
  if (value === undefined) {
    return null;
  }
  let data = value.data;

  if (data) {
    if (isNormalizedArray(value.data)) {
      const normalizedArray = value.data;

      data = normalizedArray.value.map((id) =>
        get(container, [normalizedArray.itemKey, hashParams(id)])
      );
    } else if (isRefValue(value.data)) {
      const ref = value.data;
      data = get(container, [ref.key, hashParams(ref.value)]);
    }
  }

  return {
    isLoading: value.isLoading,
    data,
    isInvalidated: value.isInvalidated || false,
  };
};

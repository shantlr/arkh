import { all } from 'redux-saga/effects';

import { API } from 'api';
import {
  normalizedQueryArrayResult,
  normalizedQuerySingleResult,
} from 'lib/cache';
import { createCacheQuerySaga } from 'lib/cache/redux/saga';

const handlers = {
  templates: async ({ key, params }) => {
    const result = await API.template.list();

    return normalizedQueryArrayResult({
      key,
      params,
      itemKey: 'template',
      value: result,
    });
  },
  commands: async ({ key, params }) =>
    API.command.list().then((r) =>
      normalizedQueryArrayResult({
        key,
        params,
        itemKey: 'command',
        value: r,
      })
    ),
  command: async ({ key, params: id }) =>
    API.command.get(id).then((r) =>
      normalizedQuerySingleResult({
        key,
        params: id,
        value: r,
      })
    ),
  runners: async ({ key }) =>
    API.runner.list().then((r) =>
      normalizedQueryArrayResult({
        key,
        itemKey: 'runner',
        value: r,
      })
    ),
};

export function* rootSaga() {
  yield all([createCacheQuerySaga(handlers)]);
}

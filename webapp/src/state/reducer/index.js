import {
  at,
  branchAction,
  composable,
  composeReducer,
  getAction,
  initState,
  mapAction,
  mapActions,
  mergeValue,
  setValue,
  unsetValue,
} from 'compose-reducer';
import { isNil, isPlainObject } from 'lodash';
import {
  QUERY_ERROR,
  QUERY_INVALIDATE_QUERY,
  QUERY_STARTED,
  QUERY_SUCCESS,
  QUERY_UPDATE_CACHE,
} from 'state/action';
import { hashParams, QUERY_TYPE } from 'state/lib';

export const reducer = composeReducer(
  initState({
    data: {},
  }),
  at(
    'data',
    branchAction({
      [QUERY_STARTED]: composable(
        setValue((state, { key, params }) => {
          return [QUERY_TYPE, key, hashParams(params), 'isLoading'];
        }, true)
      ),
      [QUERY_ERROR]: composable(
        at(
          (state, { key, params }) => [QUERY_TYPE, key, hashParams(params)],

          mergeValue('', {
            isLoading: false,
          }),
          setValue('error', getAction('error'))
        )
      ),
      [QUERY_SUCCESS]: composable(
        mergeValue(
          (state, { key, params }) => [QUERY_TYPE, key, hashParams(params)],
          {
            isLoading: false,
            error: null,
            isInvalidated: false,
          }
        ),
        mapActions(
          (state, action) => action.result,
          mergeValue((state, action) => action.path, getAction('value'))
        )
      ),
      [QUERY_UPDATE_CACHE]: composable(
        mapAction(
          (state, action) => ({
            type: isNil(action)
              ? 'delete'
              : isPlainObject(action.value)
              ? 'merge'
              : 'set',
            path: action.path,
            value: action.value,
          }),
          branchAction({
            merge: mergeValue(getAction('path'), getAction('value')),
            delete: unsetValue(getAction('path')),
            set: setValue(getAction('path'), getAction('value')),
          })
        )
      ),
      [QUERY_INVALIDATE_QUERY]: composable(
        setValue(
          (state, { key, params }) => [
            QUERY_TYPE,
            key,
            hashParams(params),
            'isInvalidated',
          ],
          true
        )
      ),
    })
  )
);

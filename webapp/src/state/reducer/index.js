import {
  at,
  branchAction,
  composable,
  composeReducer,
  getAction,
  initState,
  mapActions,
  setValue,
} from 'compose-reducer';
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
        setValue(
          (state, { key, params }) => [
            QUERY_TYPE,
            key,
            hashParams(params),
            'isLoading',
          ],
          false
        ),
        setValue(
          (state, { key, params }) => [
            QUERY_TYPE,
            key,
            hashParams(params),
            'error',
          ],
          getAction('error')
        )
      ),
      [QUERY_SUCCESS]: composable(
        setValue(
          (state, { key, params }) => [
            QUERY_TYPE,
            key,
            hashParams(params),
            'isLoading',
          ],
          false
        ),
        setValue(
          (state, { key, params }) => [
            QUERY_TYPE,
            key,
            hashParams(params),
            'error',
          ],
          () => null
        ),
        setValue(
          (state, { key, params }) => [
            QUERY_TYPE,
            key,
            hashParams(params),
            'isInvalidated',
          ],
          false
        ),
        mapActions(
          (state, action) => action.result,
          setValue((state, action) => action.path, getAction('value'))
        )
      ),
      [QUERY_UPDATE_CACHE]: composable(
        setValue((state, { path }) => path, getAction('value'))
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

import { API } from 'api';
import { useEffect, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTemplates } from 'state';
import { selectTemplates } from 'state/selector';

const defaultState = { isLoading: false };
const reducer = (state, action) => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true };
    case 'SUCCESS':
      return { ...state, error: null, isLoading: false };
    case 'ERROR': {
      return { ...state, error: null, isLoading: false };
    }
    default:
  }
};

export const useQuery = ({ selector, fetcher, actionToDispatch }) => {
  const [localState, dispatchLocalState] = useReducer(reducer, defaultState);
  const dispatch = useDispatch();
  const value = useSelector(selector);

  useEffect(() => {
    let cancel = false;
    const handler = async () => {
      dispatchLocalState({ type: 'LOADING' });
      try {
        const res = await fetcher();
        if (cancel) {
          return;
        }

        dispatch(actionToDispatch(res));
        dispatchLocalState({ type: 'SUCCESS' });
      } catch (err) {
        dispatchLocalState({ type: 'ERROR' });
      }
    };
    handler();

    return () => {
      cancel = true;
    };
  }, [fetcher, dispatch]);

  return {
    isLoading: localState.isLoading,
    data: value,
  };
};

export const useTemplates = () => {
  return useQuery({
    selector: selectTemplates,
    fetcher: API.template.list,
    actionToDispatch: updateTemplates,
  });
};

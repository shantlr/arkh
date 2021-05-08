import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevTools } from 'redux-devtools-extension';

import { reducer } from './reducer';
import { rootSaga } from './sagas';

export * from './action';
export * from './reducer';

const sagaMiddleware = createSagaMiddleware();

const enhancer = composeWithDevTools(applyMiddleware(sagaMiddleware));
export const store = createStore(reducer, enhancer);

sagaMiddleware.run(rootSaga);

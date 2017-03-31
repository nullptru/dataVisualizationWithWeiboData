import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux'
import {createStore} from 'redux'

import App from './App';
import indexReducer from './reducer/indexReduce'

let store = createStore(indexReducer);

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
  document.getElementById('root')
);

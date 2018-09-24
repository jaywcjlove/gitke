import React from 'react';
import ReactDOM from 'react-dom';
import { init } from '@rematch/core';
import { Provider } from 'react-redux';
import { Router, withRouter } from 'react-router-dom';
import history from './history';
import RoutersController from './Router';
import { getRouterData } from './common/router';
import * as models from './models/global';
import './styles/index.less';


const RoutersContainer = withRouter(({ history: historyData, location }) => {
  const routerData = getRouterData();
  const resetProps = {
    location,
    history: historyData,
    routerData,
  };
  return (
    <RoutersController resetProps={resetProps} />
  );
});

const store = init({
  models: {
    global: models.default || models,
  },
});

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <RoutersContainer />
    </Router>
  </Provider>,
  document.getElementById('root'),
);

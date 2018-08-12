import React from 'react';
import { Router, Switch, withRouter, Route } from 'react-router-dom';
import history from './history';
import { getRouterData } from './common/router';

const RoutersContainer = withRouter(({ history: historyData, location }) => {
  const routerData = getRouterData();
  const BasicLayout = routerData['/'].component;
  const UserLayout = routerData['/login'].component;
  const UserJoinLayout = routerData['/join'].component;
  const resetProps = {
    location,
    history: historyData,
    routerData,
  };
  return (
    <Switch>
      <Route path="/login" render={props => <UserLayout {...props} {...resetProps} />} />
      <Route path="/join" render={props => <UserJoinLayout {...props} {...resetProps} />} />
      <Route path="/" render={props => <BasicLayout {...props} {...resetProps} />} />
    </Switch>
  );
});

export default () => (
  <Router history={history}>
    <RoutersContainer />
  </Router>
);

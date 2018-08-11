import React from 'react';
import { BrowserRouter, Switch, withRouter, Route } from 'react-router-dom';
import { getRouterData } from './common/router';

const RoutersContainer = withRouter(({ history, location }) => {
  const routerData = getRouterData();
  const BasicLayout = routerData['/'].component;
  const UserLayout = routerData['/login'].component;
  const UserJoinLayout = routerData['/join'].component;
  const resetProps = {
    location,
    history,
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
  <BrowserRouter>
    <RoutersContainer />
  </BrowserRouter>
);

import React, { PureComponent } from 'react';
import { Switch, Route } from 'react-router-dom';
import styles from './UserLayout.less';

export default class UserLayout extends PureComponent {
  render() {
    const { routerData } = this.props;
    const RouteComponents = [];
    Object.keys(routerData).forEach((path, idx) => {
      if (/^(\/user\/)/.test(path)) {
        RouteComponents.push(<Route exact key={idx + 1} path={path} component={routerData[path].component} />);
      }
    });
    return (
      <div className={styles.container}>
        <Switch>
          {RouteComponents}
        </Switch>
      </div>
    );
  }
}

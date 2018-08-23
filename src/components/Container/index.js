import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Icon, Tooltip } from 'uiw';
import classNames from 'classnames';
import styles from './index.less';
import LOGO from './logo';

export default class Container extends Component {
  constructor() {
    super();
    this.state = {};
  }
  render() {
    const { menuData, children, location } = this.props;
    return (
      <div className={styles.wapper}>
        <div className={styles.topNav}>
          <Link to="/">
            <LOGO className={styles.logo} />
          </Link>
          <div className={styles.topMenu}>
            {menuData.map((item, index) => {
              const iconView = typeof item.icon === 'string' ? <Icon type={item.icon} /> : item.icon;
              if (!item.name) return null;
              return (
                <Tooltip key={index} placement="right" content={item.name}>
                  <Link
                    to={item.path}
                    className={classNames({
                      [`${styles.active}`]: (new RegExp(`^${item.path}`)).test(location.pathname),
                    })}
                  >
                    {iconView}
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        </div>
        {children}
      </div>
    );
  }
}

Container.propTypes = {
  menuData: PropTypes.array,
  location: PropTypes.object,
};

Container.defaultProps = {
  menuData: [],
  location: {},
};

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Icon, Tooltip } from 'uiw';
import classNames from 'classnames';
import styles from './index.less';
import LOGO from './logo';

// /user/23/info => ['/user','/user/23,'/user/23/info']
function urlToList(url) {
  const urllist = url.split('/').filter(i => i);
  return urllist.map((urlItem, index) => {
    return `/${urllist.slice(0, index + 1).join('/')}`;
  });
}
// 真实路由 /user/:id/info 菜单选中 只需返回 /user 即可
// 菜单选中问题
function defaultActiveReal(menuData, defaultActive) {
  let url = '';
  menuData.forEach((item) => {
    if ((new RegExp(`^${item.path}`)).test(defaultActive)) url = item.path;
    if (item.children && item.children.length > 0) {
      url = defaultActiveReal(item.children, defaultActive) || url;
    }
  });
  return url;
}

export default class Container extends Component {
  constructor() {
    super();
    this.state = {};
  }
  onSelect() { }
  onClose() { }
  getSelectedMenuKeys = () => {
    const { location: { pathname } } = this.props;
    return urlToList(pathname);
  }
  navMenuItemsRender(menuData = []) {
    if (menuData.length === 0) return [];
    return menuData.map((item, idx) => {
      if (!item.name) {
        return null;
      }
      const itemPath = item.path;
      if (item.children && item.children.length && item.children.some(child => child.name)) {
        const iconView = typeof item.icon === 'string' ? <Icon type={item.icon} /> : item.icon;
        return (
          <Menu.SubMenu
            index={itemPath}
            title={item.icon ? (<span> {iconView}<span>{item.name}</span> </span>) : item.name}
            key={`${itemPath}${idx}`}
          >
            {this.navMenuItemsRender(item.children, itemPath)}
          </Menu.SubMenu>
        );
      }
      const icon = item.icon && typeof item.icon === 'string' ? <Icon type={item.icon} /> : item.icon;
      return (
        <Menu.Item key={`${itemPath}${idx}`} index={itemPath}>
          {
            /^https?:\/\//.test(itemPath) ? (
              <a href={itemPath} target={item.target}> {icon}<span>{item.name}</span> </a>
            ) : (
              <Link to={itemPath} target={item.target} replace={itemPath === this.props.location.pathname}>
                {icon}<span>{item.name}</span>
              </Link>
            )
          }
        </Menu.Item>
      );
    });
  }
  render() {
    const { menuData, collapsed, children } = this.props;
    const defaultOpened = collapsed ? [] : this.getSelectedMenuKeys();
    let defaultActive = defaultOpened && defaultOpened.length > 0 ? defaultOpened[defaultOpened.length - 1] : '/';
    defaultActive = defaultActiveReal(menuData, defaultActive);
    const subMenuData = menuData.filter(item => (new RegExp(`^${item.path}`)).test(defaultActive));
    const width = (() => {
      if (subMenuData.length === 0) return 0;
      if (subMenuData[0].children && subMenuData[0].children.length > 0) return 206;
      return 0;
    })();
    return (
      <div className={styles.wapper}>
        <div className={styles.topNav}>
          <Link to="/">
            <LOGO className={styles.logo} />
          </Link>
          <div className={styles.topMenu}>
            {menuData.map((item, index) => {
              const iconView = typeof item.icon === 'string' ? <Icon type={item.icon} /> : item.icon;
              return (
                <Tooltip key={index} placement="right" content={item.name}>
                  <Link
                    to={item.path}
                    className={classNames({
                      [`${styles.active}`]: (new RegExp(`^${item.path}`)).test(defaultActive),
                    })}
                  >
                    {iconView}
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <div
          className={styles.sidebarAuto}
          style={{ width }}
        >
          {subMenuData && subMenuData.length > 0 && (
            <div className={styles.title}>
              {subMenuData[0].name}
            </div>
          )}
          {subMenuData && subMenuData.length > 0 && (
            <Menu
              theme="dark"
              mode="inline"
              inlineIndent={14}
              defaultActive={defaultActive}
              defaultOpened={defaultOpened}
              onClose={this.onClose.bind(this)}
              onSelect={this.onSelect.bind(this)}
            >
              {this.navMenuItemsRender(subMenuData[0].children)}
            </Menu>
          )}
        </div>
        <div className={styles.container} style={{ marginLeft: width + 64 }}>
          {children}
        </div>
      </div>
    );
  }
}

Container.propTypes = {
  menuData: PropTypes.array,
  collapsed: PropTypes.bool,
  location: PropTypes.object,
};

Container.defaultProps = {
  collapsed: false,
  menuData: [],
  location: {},
};

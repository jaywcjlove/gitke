import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu, Icon } from 'uiw';
import styles from './index.less';

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

/**
 * 转换路由数据
 * 将 _:owner_:repo 替换成真实路由
 * @param {Array} data 菜单数据
 * @param {Object} match 路由数据
 * @param {String} path 类似 /_:owner_:repo 数据
 */
function subMenuDataReal(data = [], match, path) {
  return data.map((item) => {
    if (item.path.indexOf(path) > -1) {
      item.path = item.path.replace(path, match.pathReal);
    }
    if (item.path) item.path = item.path.replace(/\/$/, '');
    if (item.children && item.children.length > 0) {
      item.children = subMenuDataReal(item.children, match, path);
    }
    return item;
  });
}

export default class SubMenuContainer extends Component {
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
    const { menuData, collapsed, match, children, repoName } = this.props;
    const defaultOpened = collapsed ? [] : this.getSelectedMenuKeys();
    let defaultActive = defaultOpened && defaultOpened.length > 0 ? defaultOpened[defaultOpened.length - 1] : '/';
    defaultActive = defaultActiveReal(menuData, defaultActive);
    let subMenuData = menuData.filter(item => (new RegExp(`^${item.path}`)).test(defaultActive));
    // 判断路由匹配 /:owner/:repo
    // 二级菜单过滤
    if (subMenuData && subMenuData.length === 0 && match.path.indexOf('/:') > -1) {
      let paramsRouterPath = '';
      subMenuData = menuData.filter((item) => {
        const pathReal = item.path.split('_:').map(_item => match.params[_item] && _item).filter(_item => _item);
        const urlArr = pathReal.join('_:');
        if (item.path === `/_:${urlArr}`) {
          paramsRouterPath = `/_:${urlArr}`;
          match.pathReal = `/${pathReal.map(_item => match.params[_item]).join('/')}`;
        }
        return item.path === `/_:${urlArr}`;
      });
      if (subMenuData.length > 0) {
        subMenuData = subMenuDataReal(subMenuData, match, paramsRouterPath, repoName);
      }
      // 选中二级子菜单
      if (subMenuData[0] && subMenuData[0].children && subMenuData[0].children.length > 0) {
        subMenuData[0].children.forEach((_item) => {
          if ((new RegExp(`^${_item.path}`)).test(match.url)) defaultActive = _item.path;
        });
      }
    }
    const width = (() => {
      if (subMenuData.length === 0) return 0;
      if (subMenuData[0].children && subMenuData[0].children.length > 0) return 206;
      return 0;
    })();
    return [
      <div
        key="sidebar"
        className={styles.sidebarAuto}
        style={{ width }}
      >
        {subMenuData && subMenuData.length > 0 && (
          <div className={styles.title}>
            {repoName || subMenuData[0].name}
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
      </div>,
      <div key="container" style={{ paddingLeft: width + 64 }} className={styles.container}>
        {children}
      </div>,
    ];
  }
}


SubMenuContainer.propTypes = {
  menuData: PropTypes.array,
  collapsed: PropTypes.bool,
  location: PropTypes.object,
};

SubMenuContainer.defaultProps = {
  collapsed: false,
  menuData: [],
  location: {},
};

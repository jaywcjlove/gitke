import React, { PureComponent } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { getMenuData } from '../common/menu';
import Container from '../components/Container';
import GlobalHeader from '../components/GlobalHeader';
// import styles from './BasicLayout.less';

// const socket = new WebSocket(`ws://${location.host}/api/ws`);

/**
 * 根据菜单取得重定向地址.
 */
const redirectData = [];
const getRedirect = (item) => {
  if (item && item.children) {
    if (item.children[0] && item.children[0].path) {
      redirectData.push({
        from: `${item.path}`,
        to: `${item.children[0].path}`,
      });
      item.children.forEach((children) => { getRedirect(children); });
    }
  }
};
getMenuData().forEach(getRedirect);

class BasicLayout extends PureComponent {
  constructor() {
    super();
    this.state = {};
  }
  componentDidMount() {
    this.props.verify();
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  getPathToTitle(menuData, pathname) {
    let title = null;
    menuData.forEach((item) => {
      if (item.path === pathname.replace(/\/$/, '')) {
        title = item.name;
      }
      if (!title && item.children && item.children.length > 0) {
        title = this.getPathToTitle(item.children, pathname);
      }
    });
    return title;
  }
  /**
   * 根据路由获取面包屑数据
   * 面包屑数据： [{ title: '一级菜单', href: '/' }, ...]
   */
  getRouteBreadcrumb() {
    const { location: { pathname } } = this.props;
    const pathnames = pathname.replace(/^\//, '').split('/');
    const breadcrumbs = [{ title: '首页', href: '/' }];
    let urls = '/';
    pathnames.forEach((item, idx) => {
      urls += item;
      if (pathnames.length - 1 !== idx) urls += '/';
      else {
        urls = urls.replace(/\/$/, '');
      }
      const props = {};
      const title = this.getPathToTitle(getMenuData(), urls);
      if (title) props.title = title;
      props.href = urls;
      // 重定向连接地址
      if (!props.href && redirectData.length > 0) {
        const redirect = redirectData.filter(_item => _item.from === urls.replace(/\/$/, ''));
        if (redirect.length > 0) props.href = redirect[0].to;
      }
      // 首页去重
      if (pathname !== '/home') {
        breadcrumbs.push(props);
      }
    });
    return breadcrumbs;
  }
  logout() {
    this.props.logout();
  }
  render() {
    const { routerData, userData } = this.props;
    const RouteComponents = [];
    const RouteComponentsPath = [];
    // 重定向地址
    redirectData.forEach((item, idx) => {
      RouteComponentsPath.push(item.from);
      RouteComponents.push(<Redirect key={idx} exact from={item.from} to={item.to} />);
    });
    // 根路径重定向
    RouteComponents.push(<Redirect key="index" exact from="/" to="/dashboard/overview" />);
    Object.keys(routerData).forEach((path, idx) => {
      if (path !== '/') {
        const Comp = routerData[path].component;
        // RouteComponentsPath.push(path);
        // Comp组件，可以给子组件传一些参数
        RouteComponents.push(
          <Route exact key={idx + 1} path={path} render={props => <Comp breadcrumb={this.getRouteBreadcrumb()} {...props} />} />
        );
      }
    });
    console.log('~~~:', RouteComponentsPath);
    return (
      <Container menuData={getMenuData()} {...this.props}>
        <GlobalHeader breadcrumb={this.getRouteBreadcrumb()} userData={userData} token={this.props.token} />
        <Switch>
          {RouteComponents}
          <Route render={() => <Redirect to="/dashboard/overview" />} />
        </Switch>
      </Container>
    );
  }
}

const mapState = ({ global, account }) => ({
  test: global.test,
  token: account.token,
  userData: account.userData,
});
const mapDispatch = ({ account }) => ({
  verify: account.verify,
});

export default connect(mapState, mapDispatch)(BasicLayout);

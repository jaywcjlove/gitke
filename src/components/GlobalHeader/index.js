import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, Icon } from 'uiw';
import styles from './index.less';

export default class index extends Component {
  constructor() {
    super();
    this.state = {};
  }
  componentDidMount() {
    window.addEventListener('resize', this.resizeWidth.bind(this), false);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeWidth.bind(this), false);
  }
  resizeWidth() {
    if (this.instance) {
      this.instance.style.width = `${this.instance.parentNode.clientWidth}px`;
    }
  }
  getInstance = (instance) => {
    if (instance) {
      this.instance = instance;
      this.modifyInnerWidth();
    }
  }
  modifyInnerWidth() {
    this.instance.style.width = `${this.instance.parentNode.clientWidth}px`;
  }
  render() {
    const { userData, token, breadcrumb } = this.props;
    return (
      <div className={styles.header}>
        <div className={styles.inner} ref={this.getInstance}>
          {breadcrumb && breadcrumb.length > 0 && (
            <Breadcrumb>
              {breadcrumb.map((item, idx) => {
                if (item.title) {
                  return <Breadcrumb.Item key={idx}><Link to={item.href}> {item.title} </Link></Breadcrumb.Item>;
                }
                return null;
              })}
            </Breadcrumb>
          )}
          <div className={styles.right}>
            <Link className={styles.plus} to="/new"><Icon type="plus" /></Link>
            {token ? <Link to="/account/profile">Hi! {userData.username || '-'}</Link> : <Link to="/login"> 登录 </Link>}
            {token && <Link to="/login"> 退出登录 </Link>}
          </div>
        </div>
      </div>
    );
  }
}

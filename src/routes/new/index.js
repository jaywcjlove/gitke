import React, { PureComponent } from 'react';
import styles from './index.less';

export default class Create extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <div className={styles.warpper}>
        new
      </div>
    );
  }
}
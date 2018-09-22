import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './index.less';

export default class RepoPath extends Component {
  render() {
    const { owner, repo } = this.props;
    return (
      <div className={styles.path}>
        <Link to={`/${owner}`}>{owner}</Link>
        <span className={styles.pathDivider} />
        <Link to={`/${owner}/${repo}`}>{repo}</Link>
      </div>
    );
  }
}

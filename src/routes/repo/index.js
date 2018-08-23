import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import styles from './index.less';

class Repo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    // const { match } = this.props;
    // this.props.setTitle(match.params.repo);
  }
  render() {
    return (
      <div className={styles.warpper}>
        Code/repo
      </div>
    );
  }
}

const mapState = ({ global }) => ({
  test: global.test,
});
const mapDispatch = ({ account, repo }) => ({
  verify: account.verify,
  setTitle: repo.setTitle,
});

export default connect(mapState, mapDispatch)(Repo);

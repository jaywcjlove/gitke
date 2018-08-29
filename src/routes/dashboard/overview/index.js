import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PageHeader from '../../../components/PageHeader';
import ListPage from '../../../components/ListPage';

class Overview extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
    };
  }
  componentDidMount() {
    const { userData } = this.props;
    this.props.getRepos({ owner: userData.username, page: this.state.page });
  }
  onChange(pageNumber) {
    const { userData } = this.props;
    this.props.getRepos({ owner: userData.username, page: pageNumber });
  }
  render() {
    const { repos } = this.props;
    return (
      <PageHeader title="Your Repos">
        <ListPage
          header="Repositories"
          onChange={this.onChange.bind(this)}
          data={repos.rows}
          count={repos.count}
          limit={repos.limit}
          page={repos.page}
        />
      </PageHeader>
    );
  }
}

const mapState = ({ account, repo }) => ({
  userData: account.userData,
  repos: repo.repos,
});
const mapDispatch = ({ account, repo }) => ({
  verify: account.verify,
  getRepos: repo.getRepos,
});

export default connect(mapState, mapDispatch)(Overview);
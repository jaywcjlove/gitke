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
    if (userData) {
      this.props.getRepos({ owner: userData.username, page: this.state.page });
    }
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

const mapState = ({ global, repo }) => ({
  userData: global.userData,
  repos: repo.repos,
});
const mapDispatch = ({ repo }) => ({
  getRepos: repo.getRepos,
});

export default connect(mapState, mapDispatch)(Overview);

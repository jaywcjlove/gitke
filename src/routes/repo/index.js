import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Card } from 'uiw';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Icon from '../../components/Icon/Repos';
import Markdown from '../../components/Markdown';
import styles from './index.less';

class Repo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    const { match } = this.props;
    if (match.params.owner && match.params.repo) {
      this.props.getRepoDetail({ ...match.params });
      this.props.getRepoDetailReadme({ ...match.params });
    }
  }
  render() {
    const { detail, match } = this.props;
    const { owner, repo } = match.params;
    let { readmeContent } = this.props;
    readmeContent = readmeContent.replace(/\\\n/g, '<br>');
    return (
      <PageHeader
        title={(
          <div>
            <Link to={`/${owner}`}>{owner}</Link>
            <span className={styles.pathDivider}>/</span>
            <Link to={`/${owner}/${repo}`}>{repo}</Link>
          </div>
        )}
        content={detail.description || 'No description, website, or topics provided.'}
      >
        {readmeContent && (
          <Card
            noHover
            className={styles.cardReadme}
            title={
              <span className={styles.title}>
                <Icon type="octiconbook" />
                <span>README.md</span>
              </span>
            }
          >
            <Markdown source={readmeContent} />
          </Card>
        )}
      </PageHeader>
    );
  }
}

const mapState = ({ repo }) => ({
  detail: repo.detail,
  readmeContent: repo.readmeContent,
});
const mapDispatch = ({ account, repo }) => ({
  verify: account.verify,
  getRepoDetail: repo.getRepoDetail,
  getRepoDetailReadme: repo.getRepoDetailReadme,
});

export default connect(mapState, mapDispatch)(Repo);

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Card, Table } from 'uiw';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Icon from '../../components/Icon/Repos';
import Markdown from '../../components/Markdown';
import styles from './index.less';

class Repo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      columns: [
        {
          key: 'icon',
          width: 16,
          render: (type) => {
            if (type === 'tree') return <Icon type="folder" />;
            if (type === 'commit') return <Icon type="submodule" />;
            if (type === 'blob') return <Icon type="file" />;
            return null;
          },
        },
        {
          key: 'content',
          className: 'content',
          render: (item) => {
            const text = `${item.name} ${item.type === 'commit' ? `@${item.id.substring(0, 7)}` : ''}`;
            return (
              <Link to={item.path} title={text}>{text}</Link>
            );
          },
        },
        { key: 'message' },
        { key: 'age', width: 180 },
      ],
    };
  }
  componentDidMount() {
    const { match } = this.props;
    if (match.params.owner && match.params.repo) {
      this.props.getRepoDetail({ ...match.params });
      this.props.getRepoDetailReadme({ ...match.params });
    }
  }
  readmeContent(content) {
    const { reposTree } = this.props;
    const props = {
      noHover: true,
      className: styles.cardReadme,
      title: (
        <span className={styles.title } >
          <Icon type="octiconbook" />
          <span>README.md</span>
        </span >
      ),
    };
    if (reposTree && reposTree.tree && reposTree.tree.length === 0) delete props.title;
    return (
      <Card {...props}>
        <Markdown source={content} />
      </Card>
    );
  }
  render() {
    const { detail, match, reposTree } = this.props;
    const { owner, repo } = match.params;
    let { readmeContent } = this.props;
    readmeContent = readmeContent.replace(/\\\n/g, '<br>');
    console.log('reposTree:', reposTree);
    // https://github.com/jaywcjlove/gitke/commit/2b4c6ba291a4544b9d6ed3203de7407c0d726d0b
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
        {reposTree && reposTree.tree && reposTree.tree.length > 0 && (
          <Table
            className={styles.table}
            caption={
              <span className={styles.title}>
                <Link className={styles.commitAuthor} to={`/${reposTree.owner.name}`}>{reposTree.owner.name}</Link>
                <Link className={styles.message} to={`/${owner}/${repo}/commit/${reposTree.sha}`}>{reposTree.summary}</Link>
              </span>
            }
            showHeader={false}
            data={reposTree.tree}
            columns={this.state.columns}
          />
        )}
        {readmeContent && this.readmeContent(readmeContent)}
      </PageHeader>
    );
  }
}

const mapState = ({ repo }) => ({
  detail: repo.detail,
  reposTree: repo.reposTree,
  readmeContent: repo.readmeContent,
});
const mapDispatch = ({ account, repo }) => ({
  verify: account.verify,
  getRepoDetail: repo.getRepoDetail,
  getRepoDetailReadme: repo.getRepoDetailReadme,
});

export default connect(mapState, mapDispatch)(Repo);

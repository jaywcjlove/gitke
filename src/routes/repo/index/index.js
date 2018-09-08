import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Card, Table, Breadcrumb, Button, Modal, Icon as IconUiw } from 'uiw';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Icon from '../../../components/Icon/Repos';
import Markdown from '../../../components/Markdown';
import { urlToList } from '../../../utils/utils';
import styles from './index.less';
import CloneModal from './CloneModal';

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
        {
          key: 'size',
        },
        {
          key: 'message',
          render: (item) => {
            return (
              <Link to={item.path} title={item.message}>{item.message}</Link>
            );
          },
        },
        { key: 'age', width: 180 },
      ],
    };
  }
  async componentDidMount() {
    const { match } = this.props;
    if (match.params.owner && match.params.repo) {
      if (match.params[0]) {
        // => /:owner/:repo/blob/:branch/**
        match.params.path = match.params[0];
      }
      await this.props.getRepoDetail({ ...match.params });
    }
  }
  getRepoHost() {
    const { owner, repo } = this.props.match.params;
    return `${location.origin}/${owner}/${repo}.git`;
  }
  showCloneModal() {
    const repo = this.getRepoHost();
    Modal.info({
      title: 'Clone this repository',
      className: styles.cloneModelInfo,
      content: <CloneModal repo={repo} />,
      okText: 'Close',
    });
  }
  readmeContent(content) {
    const { reposTree } = this.props;
    const props = {
      noHover: true,
      className: styles.cardReadme,
      title: (
        <span className={styles.title} >
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
    const { detail, match, reposTree, reference } = this.props;
    const { owner, repo } = match.params;
    const breadcrumbData = urlToList(reposTree.path || '');
    if (breadcrumbData && breadcrumbData.length > 0) {
      breadcrumbData.unshift({ name: repo, path: `/${owner}/${repo}` });
    }
    const isReadme = (reposTree && reposTree.isFile && /\.(md|markdown)/g.test(reposTree.parsePath.ext));
    console.log('reposTree:', reposTree);
    return (
      <PageHeader
        title={(
          <div>
            <Link to={`/${owner}`}>{owner}</Link>
            <span className={styles.pathDivider}>/</span>
            <Link to={`/${owner}/${repo}`}>{repo}</Link>
          </div>
        )}
        action={
          <div>
            <Button size="small" onClick={this.showCloneModal.bind(this)}>Clone</Button>
            <Button size="small"><IconUiw type="more" /></Button>
          </div>
        }
        content={detail.description || 'No description, website, or topics provided.'}
      >
        <div className={styles.fileNavigation}>
          {reposTree.path && (
            <Breadcrumb>
              {breadcrumbData.map((item, key) => {
                const props = { key };
                if (key !== 0) item.path = `/${owner}/${repo}/tree/${reference}${item.path}`;
                if (breadcrumbData.length - 1 === key) {
                  delete item.path;
                }
                console.log('item.path:', breadcrumbData.length, key, item.path);
                return (
                  <Breadcrumb.Item {...props}>
                    {item.path && <Link to={item.path}>{item.name}</Link>}
                    {!item.path && item.name}
                  </Breadcrumb.Item>
                );
              })}
            </Breadcrumb>
          )}
        </div>
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
        {isReadme && this.readmeContent(reposTree.readmeContent)}
      </PageHeader>
    );
  }
}

const mapState = ({ repo }) => ({
  reference: repo.reference,
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

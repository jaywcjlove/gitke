import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Card, Table, Breadcrumb, Button, Modal, Icon as IconUiw } from 'uiw';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Icon from '../../../components/Icon/Repos';
import Markdown from '../../../components/Markdown';
import RepoPath from '../../../components/RepoPath';
import CodeView from '../../../components/Markdown/CodeView';
import { urlToList, bytesToSize } from '../../../utils/utils';
import styles from './index.less';
import CloneModal from './CloneModal';
import DescriptionEdit from './DescriptionEdit';

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
          render: item => <Link to={item.path} title={item.message}>{item.message}</Link>,
        },
        { key: 'age', className: styles.age },
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
    if (!reposTree.entryCount) {
      props.footer = (
        <div>
          <Button onClick={this.onRemoveRepo.bind(this)} size="small" type="danger">Remove project</Button>
        </div>
      );
    }
    if (reposTree && reposTree.tree && reposTree.tree.length === 0) delete props.title;
    return (
      <Card {...props}>
        <Markdown source={content} />
      </Card>
    );
  }
  onRemoveRepo() {
    const { match, removeRepo } = this.props;
    const { owner, repo } = match.params;
    removeRepo({ owner, name: repo });
  }
  onSubmitDes() {
    // console.log('~~');
  }
  render() {
    const { detail, match, reposTree, fileDetail, reference } = this.props;
    const { owner, repo } = match.params;
    const breadcrumbData = urlToList(reposTree.path || '');
    if (breadcrumbData && breadcrumbData.length > 0) {
      breadcrumbData.unshift({ name: repo, path: `/${owner}/${repo}` });
    }
    const isReadmeExt = fileDetail && fileDetail.parsePath && /\.(md|markdown)$/.test(fileDetail.parsePath.ext);
    let isReadme = (reposTree && isReadmeExt);
    let lang = '';
    // 处理后缀显示传递给组件，代码高亮
    if (fileDetail && fileDetail.parsePath && (fileDetail.parsePath.ext || /^\./.test(fileDetail.parsePath.name))) {
      lang = fileDetail.parsePath.ext;
      lang = lang.replace(/^\./, '');
      if (/^\./.test(fileDetail.parsePath.name) && !lang) lang = fileDetail.parsePath.name.replace(/^\./, '');
    }
    let emptyReadme = '';
    // 空仓库 README.md
    if (reposTree && reposTree.tree && !reposTree.isFile && reposTree.tree.length === 0 && reposTree.readmeContent) {
      isReadme = true;
      emptyReadme = reposTree.readmeContent;
    }
    // 文件代码预览，头信息
    const CodeViewHeader = (() => {
      if (!fileDetail) return null;
      const codeLine = fileDetail.content.split('\n');
      const slocLine = codeLine.filter(_item => !!_item.replace(/\s/g, ''));
      return (
        <div className={styles.codeHeader}>
          {codeLine.length} lines ({slocLine.length} sloc)
          <span key="divider" className={styles.divider} />
          {bytesToSize(fileDetail.rawsize || 0)}
        </div>
      );
    })();
    return (
      <PageHeader
        title={<RepoPath owner={owner} repo={repo} />}
        action={
          <div>
            <Button size="small" onClick={this.showCloneModal.bind(this)}>Clone</Button>
            <Button size="small"><IconUiw type="more" /></Button>
          </div>
        }
        content={<DescriptionEdit description={detail.description} onSubmit={this.onSubmitDes.bind(this)} />}
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
        {isReadmeExt && reposTree.isFile && fileDetail && (
          <Card
            noHover
            className={styles.codeViewReadmeCard}
            title={CodeViewHeader}
            extra={
              <div>
                <Link to={`/${owner}/${repo}/edit/${reference}/${fileDetail.path}`}>Edit</Link>
                <Link target="_blank" to={`/${owner}/${repo}/raw/${reference}/${fileDetail.path}`}>Raw</Link>
              </div>
            }
          >
            {isReadmeExt && this.readmeContent(fileDetail.content)}
          </Card>
        )}
        {!isReadme && reposTree.isFile && fileDetail && (
          <Card
            noHover
            className={styles.codeViewCard}
            title={CodeViewHeader}
            extra={
              <div>
                <Link to={`/${owner}/${repo}/edit/${reference}/${fileDetail.path}`}>Edit</Link>
                <Link target="_blank" to={`/${owner}/${repo}/raw/${reference}/${fileDetail.path}`}>Raw</Link>
              </div>
            }
          >
            <CodeView lineHighlight language={lang} value={fileDetail.content} />
          </Card>
        )}
        {isReadme && !reposTree.isFile && this.readmeContent(emptyReadme || fileDetail.content)}
      </PageHeader>
    );
  }
}

const mapState = ({ repo }) => ({
  reference: repo.reference,
  detail: repo.detail,
  detailEdit: repo.detailEdit,
  fileDetail: repo.fileDetail,
  reposTree: repo.reposTree,
  readmeContent: repo.readmeContent,
});

const mapDispatch = ({ repo }) => ({
  getRepoDetail: repo.getRepoDetail,
  removeRepo: repo.removeRepo,
  getRepoDetailReadme: repo.getRepoDetailReadme,
});

export default connect(mapState, mapDispatch)(Repo);

import React, { PureComponent } from 'react';
import { Card } from 'uiw';
import CodeMirror from '@uiw/react-codemirror';

import 'codemirror/keymap/sublime';
// import 'codemirror/theme/monokai.css';

// import 'codemirror/addon/display/autorefresh';
// import 'codemirror/addon/comment/comment';
// import 'codemirror/addon/edit/matchbrackets';
// import 'codemirror/keymap/sublime';
// import 'codemirror/theme/eclipse.css';
// import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PageHeader from '../../../../components/PageHeader';
import RepoPath from '../../../../components/RepoPath';
import styles from './index.less';

class FileEdit extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      oldCode: '',
    };
  }
  componentDidMount() {
    const { match } = this.props;
    if (match.params.owner && match.params.repo) {
      if (match.params[0]) {
        // => /:owner/:repo/blob/:branch/**
        match.params.path = match.params[0];
        this.props.getRepoDetail({ ...match.params });
      }
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.fileDetail !== this.props.fileDetail) {
      this.setState({ oldCode: nextProps.fileDetail.content });
    }
  }
  render() {
    const { match, fileDetail } = this.props;
    const { oldCode } = this.state;
    const { owner, repo } = match.params;
    console.log('fileDetail:', fileDetail);
    console.log('oldCode:', oldCode);
    return (
      <PageHeader
        title={<RepoPath owner={owner} repo={repo} />}
      >
        <Card
          noHover
          className={styles.codeViewCard}
          title="title"
          extra={
            <div>
              test
            </div>
          }
        >
          {oldCode && (
            <CodeMirror
              value={oldCode}
              options={{
                // theme: 'monokai',
                keyMap: 'sublime',
                mode: 'jsx',
              }}
            />
          )}
        </Card>
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
const mapDispatch = ({ account, repo }) => ({
  verify: account.verify,
  getRepoDetail: repo.getRepoDetail,
  getRepoDetailReadme: repo.getRepoDetailReadme,
});

export default connect(mapState, mapDispatch)(FileEdit);

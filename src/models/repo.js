import { dispatch, getState } from '@rematch/core';
import request from '../utils/request';
import { bytesToSize } from '../utils/utils';
import history from '../history';

export default {
  state: {
    detail: {},
    fileDetail: null,
    reference: 'master',
    readmeContent: '',
    reposTree: {},
    repos: {
      page: 1, pages: 2, count: 0, rows: [],
    },
  },
  reducers: {
    updateState(state, payload) {
      return { ...state, ...payload };
    },
  },
  effects: {
    async getRepoDetail(options) {
      const repos = await request(`/api/repos/${options.owner}/${options.repo}`);
      const reposTree = await request(`/api/repos/${repos.id}/tree`, {
        body: options,
      });
      // 获取 目录树 是否有 README.md 文件
      let treeReadmePath = null;
      reposTree.tree = reposTree.tree.map((item) => {
        if (item.path && item.name && /readme.(md|markdown)$/.test(item.name.toLowerCase())) {
          treeReadmePath = item.path;
        }
        let path = '';
        if (options.path) {
          path = `master/${options.path}/${item.name}`;
        } else {
          path = `master/${item.name}`;
        }
        if (item.type === 'commit') {
          path = `tree/${item.id}`;
        }
        if (item.type === 'blob' || item.type === 'tree') {
          path = `${item.type}/${path}`;
        }
        return {
          icon: item.type,
          content: {
            name: item.name,
            id: item.id,
            type: item.type,
            path: `/${options.owner}/${options.repo}/${path}`,
          },
          size: item.size && bytesToSize(item.size),
          message: {
            path: `/${options.owner}/${options.repo}/commit/${item.sha}`,
            message: item.message,
          },
          age: item.committer && item.committer.relativedate,
        };
      });
      const props = { detail: repos, reposTree };
      // 如果目录树中有 README.md 文件，获取它
      if (treeReadmePath || reposTree.isFile) {
        dispatch.repo.getRepoDetailFileDetail({ ...options, path: treeReadmePath || reposTree.path });
      } else {
        props.fileDetail = null;
      }
      if (reposTree.content) {
        props.readmeContent = reposTree.content;
      }
      this.updateState(props);
    },
    /**
     * 获取一个文件的详情包括内容
     * @param {String} options.owner 仓库拥有者
     * @param {String} options.repo 仓库名字
     * @param {String} options.branch 仓库的 ref
     * @param {String} options.path 仓库文件路径
     */
    async getRepoDetailFileDetail(options) {
      const { repo: { reference } } = getState();
      const { owner, repo, branch, path } = options;
      const fileDetail = await request(`/api/repos/${owner}/${repo}/blob/${branch || reference}/${path}`);
      this.updateState({ fileDetail });
    },
    /**
     * 获取Readme文件年内容详情
     * @param {String} options.owner 仓库拥有者
     * @param {String} options.repo 仓库名字
     */
    async getRepoDetailReadme(options) {
      const repos = await request(`/api/repos/${options.owner}/${options.repo}/readme`);
      if (repos && repos.content) {
        this.updateState({ readmeContent: repos.content });
      }
    },
    // 创建一个存储库
    async createRepo(options) {
      const { owner } = options;
      const repos = await request('/api/user/repos', {
        method: 'POST',
        body: options,
      });
      history.push(`${owner}/${repos.name}`);
    },
    async getRepos(options) {
      const { owner, ...otherOptions } = options;
      const repos = await request(`/api/users/${owner}/repos`, {
        body: otherOptions,
      });
      this.updateState({ repos });
    },
  },
};

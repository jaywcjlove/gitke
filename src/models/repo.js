import request from '../utils/request';
import { bytesToSize } from '../utils/utils';
import history from '../history';

export default {
  state: {
    detail: {},
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
      reposTree.tree = reposTree.tree.map((item) => {
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
          age: '',
        };
      });
      const props = { detail: repos, reposTree };
      if (reposTree.content) {
        props.readmeContent = reposTree.content;
      }
      this.updateState(props);
    },
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

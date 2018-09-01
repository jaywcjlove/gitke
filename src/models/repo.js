import request from '../utils/request';
import history from '../history';

export default {
  state: {
    detail: {},
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
          path = options.path ? `${item.id}/${options.path}/${item.name}` : `${item.id}/${item.name}`;
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
          message: reposTree.summary,
          age: '',
        };
      }).sort((item) => {
        if (item.icon === 'commit' || item.icon === 'tree') return 0;
        return 1;
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

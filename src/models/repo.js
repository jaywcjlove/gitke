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
      const reposTree = await request(`/api/repos/${repos.id}/tree`);
      reposTree.tree = reposTree.tree.map(item => ({
        icon: item.type,
        content: {
          name: item.name,
          id: item.id,
          type: item.type,
          path: item.type === 'commit' ? `/${options.owner}/${options.repo}/tree/${item.id}` : `/${options.owner}/${options.repo}/tree/master/${item.name}`,
        },
        message: reposTree.summary,
        age: '',
      })).sort((item) => {
        if (item.icon === 'commit' || item.icon === 'tree') return 0;
        return 1;
      });
      this.updateState({ detail: repos, reposTree });
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

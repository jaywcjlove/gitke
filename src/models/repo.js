import request from '../utils/request';
import history from '../history';

export const repo = {
  state: {
    detail: null,
  },
  reducers: {
    updateState(state, payload) {
      return { ...state, ...payload };
    },
  },
  effects: {
    async getRepoDetail({ username, repoName }) {
      console.log('username, repo:', username, repoName);
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
  },
};

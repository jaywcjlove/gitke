import request from '../utils/request';

const getToken = () => localStorage.getItem('token');
const getUsername = () => {
  let user = localStorage.getItem('userData');
  try {
    user = JSON.parse(user) || {};
  } catch (error) {
    user = {};
  }
  return user;
};

export const account = {
  state: {
    token: getToken(),
    userData: getUsername(),
    loading: false,
    message: '',
  },
  reducers: {
    updateState(state, payload) {
      return { ...state, ...payload };
    },
  },
  effects: {
    async login({ username, password }) {
      this.updateState({ loading: true });
      const data = await request('/api/user/login', {
        method: 'POST',
        body: { username, password },
      });
      if (data) {
        this.updateState({ userData: data, token: data.token });
      }
      this.updateState({ loading: false });
    },
    async logout() {
      await request('/api/user/logout', { method: 'DELETE' });
    },
    async verify() {
      const data = await request('/api/user/verify');
      if (data) {
        this.updateState({ userData: data, token: data.token });
      }
    },
  },
};

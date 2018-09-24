import { dispatch } from '@rematch/core';
import request from '../utils/request';
import history from '../history';

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

export default {
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
        dispatch.global.updateState({ userData: data, token: data.token });
        history.replace('/');
      }
      this.updateState({ loading: false });
    },
    async logout() {
      await request('/api/user/logout', { method: 'DELETE' });
    },
  },
};

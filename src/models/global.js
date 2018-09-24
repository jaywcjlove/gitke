import request from '../utils/request';

export default {
  state: {
    test: '测试全局State',
    isAuthenticated: false, // 经过身份验证
    userData: null,
    token: null,
  },
  reducers: {
    updateState: (state, payload) => ({ ...state, ...payload }),
  },
  effects: {
    // 验证登录
    async verify() {
      const data = await request('/api/user/verify');
      const props = { isAuthenticated: true };
      if (data) {
        props.userData = data;
        props.token = data.token;
      }
      this.updateState({ ...props });
    },
  },
};

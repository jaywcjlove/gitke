// import request from '../utils/request';

export default {
  state: {
    test: '测试全局State',
  },
  reducers: {
    updateState(state, payload) {
      return { ...state, ...payload };
    },
  },
  effects: {},
};

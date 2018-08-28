// import request from '../utils/request';

export default {
  state: {},
  reducers: {
    updateState(state, payload) {
      return { ...state, ...payload };
    },
  },
  effects: {},
};

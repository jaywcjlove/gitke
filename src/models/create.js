// import request from '../utils/request';

export const create = {
  state: {},
  reducers: {
    updateState(state, payload) {
      return { ...state, ...payload };
    },
  },
  effects: {},
};

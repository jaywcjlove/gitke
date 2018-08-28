import request from '../utils/request';

export default {
  state: {
    orgs: [],
    orgsSelect: [],
  },
  reducers: {
    updateState(state, payload) {
      return { ...state, ...payload };
    },
  },
  effects: {
    async getOrgs() {
      const orgs = await request('/api/user/orgs');
      const orgsList = orgs.rows.map(item => ({ value: item.name, label: item.name }));
      this.updateState({ orgs: orgs.rows, orgsSelect: orgsList });
    },
  },
};

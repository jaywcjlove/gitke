const proxy = {
  _proxy: {
    proxy: {
      '/:owner/:repo/raw/:ref/*': 'http://127.0.0.1:2018'
    },
    changeHost: true,
  },
  'GET /api/user': { id: 1, username: 'kenny', sex: 6 },
};

module.exports = proxy;

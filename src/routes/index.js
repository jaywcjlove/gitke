
const debug = require('debug')('git:repo');
const authLoginToAPI = require('../middleware/authLoginToAPI');
const conf = require('../../conf/conf');

module.exports = (app) => {
  app.git = conf;
  app.use(async (ctx, next) => {
    debug('%s %s', ctx.method, ctx.url);
    ctx.state.conf = conf;
    await next();
  });
  // Git 相关路由
  app.use(require('./git-client').routes());
  // 不需要验证的路由
  app.use(authLoginToAPI([
    '/api/user/login', '/api/user/logout', '/api/user/verify'
  ], {
    // 包含需要验证的 path
    includes: [/^\/api/],
  }));
  app.use(require('./user').routes());
  app.use(require('./git/repos').routes());
  app.use(require('./git/namespaces').routes());
}
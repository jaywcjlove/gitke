const authLoginToAPI = require('../middleware/authLoginToAPI');

module.exports = (app) => {
  app.use(async (ctx, next) => {
    console.log('ctx:', ctx.url);
    await next();
  });
  // Git 相关路由
  app.use(require('./git-client').routes());
  app.use(authLoginToAPI([
    '/api/user/login', '/api/user/logout', '/api/user/verify'
  ]));
  app.use(require('./user').routes());
  app.use(require('./git/repos').routes());
  app.use(require('./git/namespaces').routes());
}
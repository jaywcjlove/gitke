module.exports = (app) => {
  app.use(async (ctx, next) => {
    // Login authentication
    if (
      !ctx.session.token &&
      !(new RegExp('^(/api/user/login|/api/user/logout|/api/user/verify)')).test(ctx.request.path)
    ) {
      ctx.response.status = 401;
      ctx.body = { message: '401 unauthorized, Please login to the account!' }
      return;
    }
    await next();
  })
  app.use(require('./user').routes());
  app.use(require('./git/repos').routes());
}
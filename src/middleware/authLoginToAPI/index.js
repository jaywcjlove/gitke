module.exports = function (urls = [], message = '401 unauthorized, Please login to the account!') {
  return async function authLoginToAPI(ctx, next) {
    // Login authentication
    if (
      !ctx.session.token &&
      !(new RegExp(`^(${urls.join('|')})`)).test(ctx.request.path)
    ) {
      ctx.response.status = 401;
      ctx.body = { message }
      return;
    }
    await next();
  }
}

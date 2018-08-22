module.exports = function (urls = [], options = {}) {
  const message = options.message || '401 unauthorized, Please login to the account!';
  const includes = options.includes;
  return async function authLoginToAPI(ctx, next) {
    const isIncludes = includes && includes.length > 0 ? includes.every(item => item.test(ctx.path)) : false;
    // Login authentication
    if (
      !ctx.session.token && isIncludes &&
      !(new RegExp(`^(${urls.join('|')})`)).test(ctx.path)
    ) {
      ctx.response.status = 401;
      ctx.body = { message }
      return;
    }
    await next();
  }
}

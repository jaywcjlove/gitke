const Models = require('../../../conf/sequelize');

module.exports = {
  userOrgsList: async (ctx) => {
    const { userInfo } = ctx.session;
    const { type, username } = ctx.query;

    let { page = 1, limit = 10 } = ctx.request.query
    page = parseInt(page || 1, 10);
    limit = parseInt(limit || 10, 10);
    const offset = (page - 1) * limit;
    const params = { limit, offset, order: [['id', 'DESC']] };
    params.where = { type: type || null };
    delete params.where.limit;
    delete params.where.page;
    const usernameStr = username || userInfo.username;

    try {
      const userData = await Models.users.findOne({ where: { username: usernameStr} });
      if (!userData) ctx.throw(404, `User ${usernameStr} does not exist`);
      // 用户权限不够
      if (!userData.admin && ctx.session.userInfo.id !== userData.id) {
        ctx.throw(401, `User ${usernameStr} has not authorized.`);
      }
      params.where.owner_id = userData.id;
      params.include = [{
        model: Models.users,
        as: 'owner',
        attributes: { exclude: ['password'] }
      }];

      const namespace = await Models.namespaces.findAndCount(params);
      const pages = parseInt((namespace.count + limit - 1) / limit); // 总页数
      ctx.body = { page, pages, limit, ...namespace }
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  }
}

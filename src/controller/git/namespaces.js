const Models = require('../../../conf/sequelize');

module.exports = {
  userOrgsList: async (ctx) => {
    const { userInfo } = ctx.session;

    let { page = 1, limit = 10 } = ctx.request.query
    page = parseInt(page || 1, 10);
    limit = parseInt(limit || 10, 10);
    const offset = (page - 1) * limit;
    const params = { limit, offset, order: [['id', 'DESC']] };
    params.where = { ...ctx.request.query, owner_id: userInfo.id, type: 'Group' };
    delete params.where.limit;
    delete params.where.page;

    try {
      const namespace = await Models.namespaces.findAndCount(params);
      const pages = parseInt((namespace.count + limit - 1) / limit); // 总页数
      ctx.body = { page, pages, limit, ...namespace }
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  }
}
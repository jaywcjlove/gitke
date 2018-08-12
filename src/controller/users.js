const uuidv3 = require('uuid/v3');
const crypto = require('crypto');
const Models = require('../../conf/sequelize');


module.exports = {
  login: async (ctx) => {
    const { username, password } = ctx.request.body;
    try {
      if (!username || !password) {
        ctx.throw(401, '用户名或密码为空！');
      }
      const cryptoPassword = crypto.createHmac('sha256', password).digest('hex');
      const account = await Models.users.findOne({
        attributes: { exclude: ['password'] },
        where: { username, password: cryptoPassword }
      });
      if (account) {
        const token = uuidv3(`gitke${account.id}`, uuidv3.URL);
        account.setDataValue('token', token);
        ctx.session.token = token;
        ctx.session.userInfo = account;
        ctx.body = account;
      } else {
        ctx.throw(401, '用户名或密码错误！');
      }
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message }
    }
  },
  created: async (ctx) => {
    const userData = ctx.request.body;
    try {
      const account = await Models.users.create(userData);
      ctx.body = account;
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message }
    }
  },
  verify: async (ctx) => {
    try {
      if (ctx.session.userInfo) {
        ctx.body = ctx.session.userInfo;
      } else {
        ctx.throw(401, '用户没有登录');
      }
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message }
    }
  },
  logout: async (ctx) => {
    delete ctx.session.token;
    delete ctx.session.userInfo;
    ctx.body = { message: '您已退出登录' };
  },
  list: async (ctx) => {
    let { page = 1, limit = 10 } = ctx.request.query
    page = parseInt(page || 1, 10);
    limit = parseInt(limit || 10, 10);
    const offset = (page - 1) * limit;
    const params = {
      limit: limit,
      offset: offset,
      order: [['id', 'DESC']]
    };
    const where = { ...ctx.request.query };
    delete where.limit;
    delete where.page;
    if (Object.keys(where).length > 0) {
      params.where = where;
    }
    params.attributes = { exclude: ['password'] };
    try {
      const data = await Models.users.findAndCount(params);
      const pages = parseInt((data.count + limit - 1) / limit); // 总页数
      ctx.body = { page, pages, limit, ...data }
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message }
    }
  }
}
const Git = require("nodegit");
const PATH = require("path");
const FS = require('fs-extra')
const Models = require('../../../conf/sequelize');
const { reposPath } = require("../../../conf/conf");

module.exports = {
  created: async (ctx) => {
    const { name, namespace_id } = ctx.request.body;
    let transaction;
    try {
      // 托管事务
      transaction = await Models.sequelize.transaction();
      const namespaces = await Models.namespaces.findOne({
        where: { id: namespace_id }
      });
      if (!namespaces) ctx.throw(404, 'The namespace does not exist.');

      const bodyData = ctx.request.body;
      if (!bodyData.path) bodyData.path = name;
      bodyData.creator_id = ctx.session.userInfo.id;
      // 创建仓库信息
      const projects = await Models.projects.create(bodyData, { transaction });
      // 验证仓库是否存在
      const currentPath = PATH.join(reposPath, namespaces.path, `${name}.git`);
      const pathExists = await FS.pathExists(currentPath);
      if (pathExists) ctx.throw(409, `Repos ${name} already exists!`);
      // 初始化一个仓库
      await Git.Repository.init(currentPath, 1);
      // 生成钩子脚本
      // "pre-receive":  "#!/usr/bin/env %s\n\"%s\" hook --config='%s' pre-receive\n",
      // "update":       "#!/usr/bin/env %s\n\"%s\" hook --config='%s' update $1 $2 $3\n",
      // "post-receive": "#!/usr/bin/env %s\n\"%s\" hook --config='%s' post-receive\n",
      // transaction commit 事务提交
      await transaction.commit();
      ctx.body = projects
    } catch (err) {
      // 事务回滚
      await transaction.rollback();
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  list: async (ctx) => {
    const { username } = ctx.params;
    let { page = 1, limit = 10 } = ctx.request.query
    page = parseInt(page || 1, 10);
    limit = parseInt(limit || 10, 10);
    const offset = (page - 1) * limit;
    const params = { limit, offset, order: [['id', 'DESC']] };
    params.where = { ...ctx.request.query };
    delete params.where.limit;
    delete params.where.page;
    params.include = [{
      model: Models.users,
      as: 'owner',
      attributes: { exclude: ['password'] }
    }];
    try {
      const users = await Models.users.findOne({ where: { username } });
      if (!users) ctx.throw(404, `Username ${username} does not exist`);
      params.where.creator_id = users.id;
      const data = await Models.projects.findAndCount(params);
      const pages = parseInt((data.count + limit - 1) / limit); // 总页数
      ctx.body = { page, pages, limit, ...data }
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  orgReposList: async (ctx) => {
    const { username } = ctx.params;
  },
  detail: async (ctx) => {
    const { owner, repo } = ctx.params;
    try {
      const namespaces = await Models.namespaces.findOne({ where: { name: owner } });
      if (!namespaces) ctx.throw(404, `Owner ${owner} does not exist`);
      ctx.body = await Models.projects.findOne({
        where: { namespace_id: namespaces.id, name: repo },
        include: [{ model: Models.users, as: 'owner', attributes: { exclude: ['password'] } }]
      });
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  }
}
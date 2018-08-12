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
}
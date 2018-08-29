const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sqliteDataPath, database } = require('./conf');

const Models = {};
const sequelize = new Sequelize(
  null, // 数据库名
  null, // 用户名
  null, // 用户密码
  {
    dialect: database.dialect,
    storage: sqliteDataPath,
    logging: false,
    operatorsAliases: false
  });

Models.sequelize = sequelize;

/**
 * sequelize 链接测试
 */
sequelize
  .authenticate()
  .then(function () {
    // debug('Sequelize 链接成功!');
  })
  .catch(function (err) {
    console.log('> sequelize 链接失败', err);
  });

/**
 * 导入模型，并导出模块
 */
fs.readdirSync(path.resolve(__dirname, '../src/model'))
  .forEach(function (file) {
    var model = sequelize.import(path.resolve(__dirname, '../src/model', file));
    Models[model.name] = model;
  });


Models.namespaces.belongsTo(Models.users, { as: 'owner', foreignKey: 'owner_id' });
Models.projects.belongsTo(Models.namespaces, { as: 'namespace', foreignKey: 'namespace_id' });
Models.projects.belongsTo(Models.users, { as: 'owner', foreignKey: 'creator_id' });

module.exports = Models;
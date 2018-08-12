const path = require('path');
const FS = require('fs-extra');
const home = require('os-homedir');

// const cachPath = path.join(home(), 'gitke-data');
const cachPath = path.join(__dirname, '..', '.gitke-data');

FS.ensureDir(cachPath);

module.exports = {
  // pid 存储目录
  pidPath: path.join(cachPath, 'gitke.pid'),
  // Git 仓存储目录
  reposPath: path.join(cachPath, 'repos'),
  // sqlite数据库存放目录
  sqliteDataPath: path.join(cachPath, 'gitke.sqlite3'),
  // 数据库设置
  database: {
    dialect: 'sqlite'
  },
  // server配置
  server: {
    host: 'localhost',
    port: 2018
  }
};

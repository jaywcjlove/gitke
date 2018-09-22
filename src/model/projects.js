const dayjs = require('dayjs');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('projects', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '项目名称'
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '项目存放位置'
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: '',
      comment: '项目介绍'
    },
    namespace_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'namespaces'
      },
      allowNull: false,
      comment: '命名空间，每个项目创建一个单独的ID，组织或者用户'
    },
    creator_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users'
      },
      allowNull: false,
      comment: '创建的用户ID'
    },
    import_url: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
      validate: {
        isUrl: { args: true, msg: 'URL格式不正确' },
      },
      comment: '导入仓库地址'
    },
    forks_url: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
      validate: {
        isUrl: { args: true, msg: 'URL格式不正确' },
      },
      comment: 'fork url'
    },
    fork: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: 'fork'
    },
    private: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: '是否私有'
    },
    updated_at: {
      type: DataTypes.DATE,
      get() {
        return dayjs(this.getDataValue('updated_at')).format('YYYY/MM/DD HH:mm:ss');
      }
    },
    created_at: {
      type: DataTypes.DATE,
      get() {
        return dayjs(this.getDataValue('created_at')).format('YYYY/MM/DD HH:mm:ss');
      }
    }
  }, {
    comment: '项目表',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    freezeTableName: true
  });
};

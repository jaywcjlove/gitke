const dayjs = require('dayjs');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('namespaces', {
    name: {
      type: DataTypes.STRING,
      unique: { msg: 'The name is repeated.' },
      allowNull: false,
      unique: { msg: '名称已存在，请勿重复提交' },
      comment: '名字'
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '路径'
    },
    owner_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '创建者id'
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
      validate: {
        isIn: {
          args: [['Group']],
          msg: '可选 Group 类型'
        }
      },
      comment: 'Group 为组，null为个人'
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: '',
      comment: '组织介绍'
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: '',
      comment: '用户头像'
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
    underscored: true,
    freezeTableName: true
  });
};

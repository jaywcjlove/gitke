const dayjs = require('dayjs');
const crypto = require("crypto");
const password = crypto.createHmac("sha256", "admin").digest("hex");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('users', {
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: '',
      validate: {
        len: { args: [1, 100], msg: '用户姓名不能为空，且长度为1-100' }
      },
      unique: { msg: '用户已存在，请勿重复提交' },
      comment: 'user name'
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        len: { args: [0, 30], msg: '姓名长度为0-30' }
      },
      comment: '姓名'
    },
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: '是否为管理员'
    },
    bio: {
      type: DataTypes.STRING,
      defaultValue: '',
      comment: '个人介绍'
    },
    location: {
      type: DataTypes.STRING,
      defaultValue: '',
      comment: '地理位置'
    },
    organization: {
      type: DataTypes.STRING,
      defaultValue: '',
      comment: '组织'
    },
    preferred_language: {
      type: DataTypes.STRING,
      defaultValue: '',
      comment: '语言'
    },
    email: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        isEmail: { args: true, msg: 'Please enter your vaild email!' }
      },
      unique: { msg: 'The mailbox is repeated.' },
      comment: 'user email'
    },
    public_email: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
      validate: {
        isEmail: { args: true, msg: '请输入正确的邮箱！' }
      },
      comment: '公开的邮箱'
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        len: { args: [0, 400], msg: 'URL，长度超出范围' }
      },
      comment: '用户头像'
    },
    linkedin: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        len: { args: [0, 400], msg: 'URL，长度超出范围' }
      },
      comment: 'user email'
    },
    web_url: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
      validate: {
        isUrl: { args: true, msg: '请输入正确的URL' },
        len: { args: [0, 400], msg: 'URL，长度超出范围' }
      },
      comment: '个人主页'
    },
    skype: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        len: { args: [0, 400], msg: 'URL，长度超出范围' }
      },
      comment: '个人主页'
    },
    state: {
      type: DataTypes.STRING(100),
      defaultValue: 'active',
      allowNull: false,
      validate: {
        isIn: {
          args: [['active', 'blocked']],
          msg: 'active:激活; blocked:禁用;'
        }
      },
      comment: '账号状态，active:激活; blocked:禁用;'
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: { args: [0, 100], msg: '且长度为1-100' }
      },
      comment: 'user password hash'
    },
    locked_at: {
      type: DataTypes.DATE,
      get() {
        if (!this.getDataValue('locked_at')) return;
        return dayjs(this.getDataValue('locked_at')).format('YYYY/MM/DD HH:mm:ss');
      },
      comment: '用户锁住定'
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
    comment: '用户表',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    // 不允许逻辑删除
    // paranoid: true,
    underscored: true,
    freezeTableName: true
  });
};

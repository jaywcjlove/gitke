const dayjs = require('dayjs');

// --Sequence
// CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq";

// --Table Definition
// CREATE TABLE "public"."users"(
//   "id" int4 DEFAULT nextval('users_id_seq':: regclass),
//   "email" varchar DEFAULT '':: character varying,
//   "encrypted_password" varchar DEFAULT '':: character varying,
//   "reset_password_token" varchar,
//   "reset_password_sent_at" timestamp,
//   "remember_created_at" timestamp,
//   "sign_in_count" int4 DEFAULT 0,
//   "current_sign_in_at" timestamp,
//   "last_sign_in_at" timestamp,
//   "current_sign_in_ip" varchar,
//   "last_sign_in_ip" varchar,
//   "created_at" timestamp,
//   "updated_at" timestamp,
//   "name" varchar,
//   "admin" bool DEFAULT false,
//   "projects_limit" int4,
//   "skype" varchar DEFAULT '':: character varying,
//   "linkedin" varchar DEFAULT '':: character varying,
//   "twitter" varchar DEFAULT '':: character varying,
//   "bio" varchar,
//   "failed_attempts" int4 DEFAULT 0,
//   "locked_at" timestamp,
//   "username" varchar,
//   "can_create_group" bool DEFAULT true,
//   "can_create_team" bool DEFAULT true,
//   "state" varchar,
//   "color_scheme_id" int4 DEFAULT 1,
//   "password_expires_at" timestamp,
//   "created_by_id" int4,
//   "last_credential_check_at" timestamp,
//   "avatar" varchar,
//   "confirmation_token" varchar,
//   "confirmed_at" timestamp,
//   "confirmation_sent_at" timestamp,
//   "unconfirmed_email" varchar,
//   "hide_no_ssh_key" bool DEFAULT false,
//   "website_url" varchar DEFAULT '':: character varying,
//   "notification_email" varchar,
//   "hide_no_password" bool DEFAULT false,
//   "password_automatically_set" bool DEFAULT false,
//   "location" varchar,
//   "encrypted_otp_secret" varchar,
//   "encrypted_otp_secret_iv" varchar,
//   "encrypted_otp_secret_salt" varchar,
//   "otp_required_for_login" bool DEFAULT false,
//   "otp_backup_codes" text,
//   "public_email" varchar DEFAULT '':: character varying,
//   "dashboard" int4 DEFAULT 0,
//   "project_view" int4 DEFAULT 0,
//   "consumed_timestep" int4,
//   "layout" int4 DEFAULT 0,
//   "hide_project_limit" bool DEFAULT false,
//   "unlock_token" varchar,
//   "otp_grace_period_started_at" timestamp,
//   "external" bool DEFAULT false,
//   "incoming_email_token" varchar,
//   "organization" varchar,
//   "ghost" bool,
//   "require_two_factor_authentication_from_group" bool DEFAULT false,
//   "two_factor_grace_period" int4 DEFAULT 48,
//   "last_activity_on" date,
//   "notified_of_own_activity" bool,
//   "preferred_language" varchar,
//   "rss_token" varchar,
//   "theme_id" int2,
//   PRIMARY KEY("id")
// );

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
        len: { args: [1, 30], msg: '姓名长度为1-30' }
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
        isEmail: { args: true, msg: '请输入正确的邮箱！'}
      },
      comment: 'user email'
    },
    public_email: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        isEmail: { args: true, msg: '请输入正确的邮箱！' }
      },
      comment: '公开的邮箱'
    },
    avatar_url: {
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
      defaultValue: '',
      validate: {
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
      defaultValue: '',
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
      }
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
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      freezeTableName: true
    });
};

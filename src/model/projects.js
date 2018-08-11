const dayjs = require('dayjs');

// --Table Definition
// CREATE TABLE "public"."projects"(
//   "id" int4 DEFAULT nextval('projects_id_seq':: regclass),
//   "name" varchar,
//   "path" varchar,
//   "description" text,
//   "created_at" timestamp,
//   "updated_at" timestamp,
//   "creator_id" int4,
//   "namespace_id" int4,
//   "last_activity_at" timestamp,
//   "import_url" varchar,
//   "visibility_level" int4 DEFAULT 0,
//   "archived" bool DEFAULT false,
//   "avatar" varchar,
//   "import_status" varchar,
//   "star_count" int4 DEFAULT 0,
//   "import_type" varchar,
//   "import_source" varchar,
//   "import_error" text,
//   "ci_id" int4,
//   "shared_runners_enabled" bool DEFAULT true,
//   "runners_token" varchar,
//   "build_coverage_regex" varchar,
//   "build_allow_git_fetch" bool DEFAULT true,
//   "build_timeout" int4 DEFAULT 3600,
//   "pending_delete" bool DEFAULT false,
//   "public_builds" bool DEFAULT true,
//   "last_repository_check_failed" bool,
//   "last_repository_check_at" timestamp,
//   "container_registry_enabled" bool,
//   "only_allow_merge_if_pipeline_succeeds" bool DEFAULT false,
//   "has_external_issue_tracker" bool,
//   "repository_storage" varchar DEFAULT 'default':: character varying,
//   "request_access_enabled" bool DEFAULT false,
//   "has_external_wiki" bool,
//   "lfs_enabled" bool,
//   "description_html" text,
//   "only_allow_merge_if_all_discussions_are_resolved" bool,
//   "ci_config_path" varchar,
//   "printing_merge_request_link_enabled" bool DEFAULT true,
//   "auto_cancel_pending_pipelines" int4 DEFAULT 1,
//   "import_jid" varchar,
//   "cached_markdown_version" int4,
//   "last_repository_updated_at" timestamp,
//   "merge_requests_rebase_enabled" bool DEFAULT false,
//   "merge_requests_ff_only_enabled" bool DEFAULT false,
//   "repository_read_only" bool,
//   "delete_error" text,
//   "storage_version" int2,
//   "resolve_outdated_diff_discussions" bool,
//   "jobs_cache_index" int4,
//   "pages_https_only" bool DEFAULT true,
//   PRIMARY KEY("id")
// );


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
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      freezeTableName: true
    });
};

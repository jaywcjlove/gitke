const dayjs = require('dayjs');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('namespaces', {
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

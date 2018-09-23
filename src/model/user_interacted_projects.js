module.exports = function (sequelize, DataTypes) {
  const userInteractedProjects = sequelize.define('user_interacted_projects', {
    project_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'projects'
      },
      allowNull: false,
      comment: '项目ID'
    },
    creator_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users'
      },
      allowNull: false,
      comment: '用户ID'
    },
  }, {
    comment: '用户对应的项目隐射表',
    underscored: true,
  });
  // http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-removeAttribute
  // Sequelize does not create id primary key
  userInteractedProjects.removeAttribute('id');
  return userInteractedProjects;
};

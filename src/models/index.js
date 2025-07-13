const { sequelize } = require('../config/database');
const Project = require('./Project');

// Define associations here if needed in the future
// Example:
// Project.hasMany(SomeOtherModel);
// SomeOtherModel.belongsTo(Project);

const models = {
  Project,
  sequelize
};

module.exports = models;

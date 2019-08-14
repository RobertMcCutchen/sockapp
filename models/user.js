'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    sockcolor: DataTypes.STRING,
    sockstyle: DataTypes.STRING,
    imageurl: DataTypes.STRING,
    emailaddress: DataTypes.STRING
  }, {});
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};
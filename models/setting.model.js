const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate({}) {}
  }
  Setting.init(
    {
      branch_id: DataTypes.STRING,
      branch_name: DataTypes.STRING,
      base_url: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "settings",
      modelName: "Setting",
      timestamps: false,
    }
  );
  return Setting;
};

const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Printer extends Model {
    static associate({}) {}
  }
  Printer.init(
    {
      name: DataTypes.STRING,
      type: DataTypes.STRING,
      ip: DataTypes.STRING,
      port: DataTypes.STRING,
      interface: DataTypes.STRING,
      content: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "printers",
      modelName: "Printer",
      timestamps: false,
    }
  );
  return Printer;
};

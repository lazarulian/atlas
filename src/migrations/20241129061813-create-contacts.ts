import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("people", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      birthday: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      yearMet: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 2002,
          max: 3100,
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      location: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      affiliation: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      lastContacted: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      contactFrequency: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      chatReminder: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("people");
  },
};

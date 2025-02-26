import { Model, DataTypes, Optional } from "sequelize";
import { PeopleAttributes, Profile } from "types/models/PeopleInterface";
import { database } from "../config/sequelize";

// Define optional attributes for creation
type PeopleCreationAttributes = Optional<
  PeopleAttributes,
  "id" | "birthday" | "email" | "location" | "affiliation"
>;

export class People
  extends Model<PeopleAttributes, PeopleCreationAttributes>
  implements Profile
{
  public id!: number;
  public name!: string;
  public active!: boolean;
  public birthday!: Date;
  public yearMet!: number;
  public phoneNumber!: string;
  public email?: string;
  public location?: string[];
  public affiliation?: string[];
  public lastContacted!: Date;
  public contactFrequency!: number;
  public chatReminder!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

People.init(
  {
    id: {
      type: DataTypes.INTEGER,
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
      defaultValue: true,
    },
    birthday: {
      type: DataTypes.DATE,
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
      defaultValue: 1,
    },
  },
  {
    sequelize: database,
    tableName: "people",
    timestamps: true,
  }
);

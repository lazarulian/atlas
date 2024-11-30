import { Model, DataTypes, Optional } from "sequelize";
import { PeopleAttributes } from "types/models/PeopleInterface";
import { database } from "../config/sequelize";

// Define optional attributes for creation
type PeopleCreationAttributes = Optional<
  PeopleAttributes,
  "id" | "email" | "location"
>;

export class People
  extends Model<PeopleAttributes, PeopleCreationAttributes>
  implements PeopleAttributes
{
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public birthday!: Date;
  public yearMet!: number;
  public phoneNumber!: string;
  public email?: string;
  public location?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

People.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birthday: {
      type: DataTypes.DATE,
      allowNull: false,
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
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: database,
    tableName: "people",
    timestamps: true,
  }
);

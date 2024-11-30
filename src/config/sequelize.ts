import { Sequelize } from "sequelize";
import { development } from "./config";

export const database = new Sequelize(development);

export default database;

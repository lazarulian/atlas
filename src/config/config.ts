import { Dialect } from "sequelize";
import logger from "./logger";

interface Config {
  database: string | undefined;
  username: string | undefined;
  password: string | undefined;
  host: string;
  dialect: Dialect;
  storage: string;
  logging?: boolean | ((msg: string, timing?: number) => void);
}

export const development: Config = {
  database: "babylon",
  username: "username",
  password: "password",
  host: "localhost",
  dialect: "sqlite",
  storage: "src/database/dev.sqlite",
  logging: false,
};

export const testing: Config = {
  database: "test",
  username: "username",
  password: "password",
  host: "localhost",
  dialect: "sqlite",
  storage: "src/database/test.sqlite",
  logging: false,
};

export const production: Config = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST || "localhost",
  dialect: "sqlite",
  storage: "src/database/prod.sqlite",
  logging: false,
};

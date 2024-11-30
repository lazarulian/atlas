export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  rootDir: "./src",
  testMatch: ["**/spec/**/*.spec.ts"],
  moduleNameMapper: {
    "^models/(.*)$": "<rootDir>/models/$1",
    "^services/(.*)$": "<rootDir>/services/$1",
    "^types/(.*)$": "<rootDir>/types/$1",
  },
};

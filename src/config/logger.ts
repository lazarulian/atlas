import { createLogger, format, transports } from "winston";

// Detect if we're running tests
const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

const logger = createLogger({
  level: isTest ? "silent" : "debug", // Silent during tests, debug otherwise
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: isTest 
    ? [] // No transports during tests (completely silent)
    : [
        new transports.Console(), // Logs to console
        new transports.File({ filename: "app.log" }), // Logs to a file
      ],
  silent: isTest, // Explicitly silence the logger during tests
});

export default logger;

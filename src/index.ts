import dotenv from "dotenv";
dotenv.config();

import express from "express";
import logger from "./config/logger";
import {
  setupSecurity,
  setupMiddleware,
  errorHandler,
  notFoundHandler,
} from "./middleware";
import setupSwagger from "./config/swagger";
import routes from "./routes";

// Initialize scheduled jobs
import "./jobs/DailyUpdates";
import "./jobs/MonthlyUpdates";

// Initialize services
import "./services/SlackService";
import "./services/NotionService";

// Set timezone
process.env.TZ = "America/Los_Angeles";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Setup security middleware
setupSecurity(app);

// Setup general middleware
setupMiddleware(app);

// Setup OpenAPI/Swagger documentation
setupSwagger(app);

// Setup routes
app.use("/", routes);

// Global error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start server
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Atlas API server started`, {
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || "development",
    timezone: process.env.TZ,
    documentation: `http://${HOST}:${PORT}/api-docs`,
    api: `http://${HOST}:${PORT}/api/v1`,
    pid: process.pid,
  });
});

export default app;

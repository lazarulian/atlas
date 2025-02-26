import dotenv from "dotenv";
dotenv.config();
import express from "express";
import logger from "./config/logger";
import "./jobs/DailyUpdates";
import "./jobs/MonthlyUpdates";
import "./services/SlackService";
import "./services/NotionService";
import routes from "./routes";
import softUpdateRoutes from "./routes/soft/updates";
import updateRoutes from "./routes/updates";
process.env.TZ = "America/Los_Angeles";

const app = express();

// Middleware to log client IPs
app.use((req, res, next) => {
  logger.debug(`Request from IP: ${req.ip}`);
  next();
});

app.use(express.json());

// Use the modular routes
app.use("/", routes);
app.use("/soft/updates", softUpdateRoutes);
app.use("/updates", updateRoutes);

const PORT = 4000;

app.listen(PORT, "0.0.0.0", () => {
  logger.debug(`Server running on http://localhost:${PORT}`);
});

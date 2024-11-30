import dotenv from "dotenv";
dotenv.config();
import express from "express";
import logger from "./config/logger";
import "./jobs/DailyUpdates";
import "./services/SlackService";
import routes from "./routes";
import peopleRoutes from "./routes/people";

const app = express();

// Middleware to log client IPs
app.use((req, res, next) => {
  logger.debug(`Request from IP: ${req.ip}`);
  next();
});

app.use(express.json());

// Use the modular routes
app.use("/", routes);
app.use("/people", peopleRoutes);

const PORT = 4000;

app.listen(PORT, "0.0.0.0", () => {
  logger.debug(`Server running on http://localhost:${PORT}`);
});

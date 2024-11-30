import { Router, Request, Response } from "express";
import executeDailyUpdates from "../jobs/DailyUpdates";
import logger from "../config/logger";
import syncPeopleFromJson from "../services/BirthdayReminderService";

const router = Router();

router.get("/update", function (req, res, next) {
  syncPeopleFromJson();
  res.status(200).send("Updated Successfully. The Coast is Clear!");
  next();
});

router.get("/report", function (req, res, next) {
  executeDailyUpdates();
  res.status(200).send("Stunt executed successfully.");
});

export default router;

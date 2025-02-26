import { Router, Request, Response } from "express";
import {
  getBirthdayReport,
  getMonthlyBirthdays,
  getUpcomingBirthdays,
} from "services/BirthdayReminderService";

const router = Router();

router.get("/upcoming", function (req, res, next) {
  res.status(200).send("Stunt executed successfully.");
});

router.get("/monthly", function (req, res, next) {
  res.status(200).send("Stunt executed successfully.");
});

router.get("/today", function (req, res, next) {
  res.status(200).send("Stunt executed successfully.");
});

export default router;

import { Router, Request, Response } from "express";
import executeDailyUpdates from "../jobs/DailyUpdates";

const router = Router();

router.get("/report", function (req, res, next) {
  executeDailyUpdates();
  res.status(200).send("Stunt executed successfully.");
});

export default router;

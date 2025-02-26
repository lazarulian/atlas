import { Router } from "express";
import executeDailyUpdates from "../../jobs/DailyUpdates";
import executeMonthlyUpdates from "../../jobs/MonthlyUpdates";

const router = Router();

router.get("/daily", function (req, res, next) {
  try {
    const overrideChannel: string = "api-testing";
    executeDailyUpdates(overrideChannel);
    res.status(200).send("Successfully fetched daily updates.");
  } catch (error) {
    res.status(400).send("Unsuccessfully fetched daily updates.");
  }
});

router.get("/monthly", function (req, res, next) {
  try {
    const overrideChannel: string = "api-testing";
    executeMonthlyUpdates(overrideChannel);
    res.status(200).send("Successfully fetched monthly updates.");
  } catch (error) {
    res.status(400).send("Unsuccessfully fetched monthly updates.");
  }
});

export default router;

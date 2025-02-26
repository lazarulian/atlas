import { Router } from "express";
import executeDailyUpdates from "../../jobs/DailyUpdates";

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

export default router;

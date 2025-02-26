import schedule from "node-schedule";
import logger from "../config/logger";
import SlackService from "../services/SlackService";
import generateBirthdayReport from "../services/BirthdayReminderService";
import ProfileUpdateService from "../services/ProfileUpdateService";

/**
 * Executes monthly updates: generates a birthday report and sends it to Slack.
 */
async function executeMonthlyUpdates(
  slackChannel: string = "monthly-updates"
): Promise<void> {
  logger.info("Starting monthly updates...");

  try {
    const slackService = SlackService.getInstance();
    logger.debug("Slack Service initialized.");

    // Update the database
    const profileUpdateService = new ProfileUpdateService();
    await profileUpdateService.syncProfilesFromNotion();

    // Generate the Birthday Report
    const birthdayReport = await generateBirthdayReport("monthly");
    logger.debug("Birthday report generated.");
    await slackService.postMessage(slackChannel, birthdayReport);
    logger.info("Birthday report successfully sent to Slack.");
  } catch (error: any) {
    logger.error("Error during monthly updates:", {
      message: error.message,
      stack: error.stack,
      ...error,
    });
  }
}

// Schedule the monthly job to run on the 1st day of each month at 5:00 AM
schedule.scheduleJob("0 5 1 * *", () => executeMonthlyUpdates());
logger.info(
  "Scheduled monthly updates job to run every first day of the month at 5:00 AM."
);

// Add a test entry point for manual execution of monthly updates
if (require.main === module) {
  (async () => {
    logger.info("Executing monthly updates manually...");
    await executeMonthlyUpdates();
  })();
}

export default executeMonthlyUpdates;

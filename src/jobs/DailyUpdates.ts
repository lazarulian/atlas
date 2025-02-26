import schedule from "node-schedule";
import logger from "../config/logger";
import SlackService from "../services/SlackService";
import generateBirthdayReport from "../services/BirthdayReminderService";
import ProfileUpdateService from "../services/ProfileUpdateService";

/**
 * Executes daily updates: generates a birthday report and sends it to Slack.
 */
async function executeDailyUpdates(
  slackChannel: string = "daily-updates"
): Promise<void> {
  logger.info("Starting daily updates...");

  try {
    const slackService = SlackService.getInstance();
    logger.debug("Slack Service initialized.");

    // Update DB
    const profileUpdateService = new ProfileUpdateService();
    await profileUpdateService.syncProfilesFromNotion();

    // Reach out To

    // Birthday Report
    const birthdayReport = await generateBirthdayReport();
    logger.debug("Birthday report generated.");
    await slackService.postMessage(slackChannel, birthdayReport);
    logger.info("Birthday report successfully sent to Slack.");
  } catch (error: any) {
    logger.error("Error during daily updates:", {
      message: error.message,
      stack: error.stack,
      ...error,
    });
  }
}

// Schedule the task to run daily at 9:00 AM
schedule.scheduleJob("0 5 * * *", () => executeDailyUpdates());
logger.info("Scheduled daily updates job to run every day at 5:00 AM.");

// Add a test entry point for manual execution
if (require.main === module) {
  (async () => {
    logger.info("Executing daily updates manually...");
    await executeDailyUpdates();
  })();
}

export default executeDailyUpdates;

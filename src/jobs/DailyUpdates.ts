import schedule from "node-schedule";
import axios from "axios";
import logger from "../config/logger";
import ProfileUpdateService from "../services/ProfileUpdateService";

/**
 * Executes daily updates: updates profiles and sends birthday report via API.
 */
async function executeDailyUpdates(
  slackChannel: string = "#daily-updates"
): Promise<void> {
  logger.info("Starting daily updates...");

  try {
    // Update DB
    const profileUpdateService = new ProfileUpdateService();
    await profileUpdateService.syncProfilesFromNotion();
    logger.info("Profile sync from Notion completed.");

    // Send Daily Birthday Report via API
    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
    const apiUrl = `${apiBaseUrl}/api/v1/birthdays/slack`;
    
    const requestData = {
      type: "daily",
      channel: slackChannel
    };

    logger.info("Sending daily birthday report via API...", { 
      url: apiUrl, 
      data: requestData 
    });

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    logger.info("Daily birthday report successfully sent via API", {
      status: response.status,
      data: response.data
    });

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error("API request failed during daily updates:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      logger.error("Error during daily updates:", {
        message: error.message,
        stack: error.stack,
        ...error,
      });
    }
  }
}

// Schedule the task to run daily at 5:00 AM
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

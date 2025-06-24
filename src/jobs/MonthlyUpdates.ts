import schedule from "node-schedule";
import axios from "axios";
import logger from "../config/logger";
import ProfileUpdateService from "../services/ProfileUpdateService";

/**
 * Executes monthly updates: updates profiles and sends birthday report via API.
 */
async function executeMonthlyUpdates(
  slackChannel: string = "#monthly-updates"
): Promise<void> {
  logger.info("Starting monthly updates...");

  try {
    // Update the database
    const profileUpdateService = new ProfileUpdateService();
    await profileUpdateService.syncProfilesFromNotion();
    logger.info("Profile sync from Notion completed.");

    // Send Monthly Birthday Report via API
    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
    const apiUrl = `${apiBaseUrl}/api/v1/birthdays/slack`;
    
    const requestData = {
      type: "monthly",
      channel: slackChannel
    };

    logger.info("Sending monthly birthday report via API...", { 
      url: apiUrl, 
      data: requestData 
    });

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    logger.info("Monthly birthday report successfully sent via API", {
      status: response.status,
      data: response.data
    });

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error("API request failed during monthly updates:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      logger.error("Error during monthly updates:", {
        message: error.message,
        stack: error.stack,
        ...error,
      });
    }
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

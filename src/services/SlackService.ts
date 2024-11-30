import { WebClient, WebClientOptions } from "@slack/web-api";
import logger from "../config/logger";

class SlackService {
  private static instance: SlackService;
  private webClient: WebClient;

  private constructor(slackToken: string, options?: WebClientOptions) {
    if (!slackToken) {
      throw new Error("SLACK_TOKEN is not set in environment variables.");
    }
    this.webClient = new WebClient(slackToken, options);
  }

  /**
   * Initializes or retrieves the single instance of SlackService.
   * @returns The singleton instance of SlackService.
   */
  public static getInstance(): SlackService {
    if (!SlackService.instance) {
      const slackToken = process.env.SLACK_TOKEN;
      if (!slackToken) {
        logger.error("SLACK_TOKEN is not set in environment variables.");
      } else {
        SlackService.instance = new SlackService(slackToken);
      }
    }
    return SlackService.instance;
  }

  /**
   * Sends a message to a specific Slack channel.
   * @param channelName - The name or ID of the Slack channel to post to.
   * @param text - The message text to post in the channel.
   * @returns A promise that resolves to the Slack API response.
   */
  async postMessage(channelName: string, text: string): Promise<void> {
    try {
      const result = await this.webClient.chat.postMessage({
        channel: channelName,
        text: text,
      });
      logger.info(
        `Message successfully posted to ${channelName}: ${result.ts}`
      );
    } catch (error: any) {
      logger.error(
        `Failed to post message to channel ${channelName}:`,
        error.message
      );
    }
  }
}

export default SlackService;

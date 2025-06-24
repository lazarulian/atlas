import { BaseSlackMessageService } from "./BaseSlackMessageService";
import { generateBirthdayMessage } from "../BirthdayReminderService";

/**
 * Domain-specific Slack service for birthday-related messages
 * Extends BaseSlackMessageService to provide birthday functionality
 */
export class BirthdaySlackMessageService extends BaseSlackMessageService {
  private static instance: BirthdaySlackMessageService;

  // Define supported message types as constants for type safety
  public static readonly MESSAGE_TYPES = {
    DAILY: "daily",
    MONTHLY: "monthly",
    UPCOMING: "upcoming",
  } as const;

  private constructor() {
    super("BirthdaySlackService");
  }

  /**
   * Singleton pattern - get the instance of BirthdaySlackMessageService
   */
  public static getInstance(): BirthdaySlackMessageService {
    if (!BirthdaySlackMessageService.instance) {
      BirthdaySlackMessageService.instance = new BirthdaySlackMessageService();
    }
    return BirthdaySlackMessageService.instance;
  }

  /**
   * Get all supported message types for this service
   */
  public getAvailableMessageTypes(): string[] {
    return Object.values(BirthdaySlackMessageService.MESSAGE_TYPES);
  }

  /**
   * Generate birthday-specific message content
   * This is where all birthday domain logic is encapsulated
   */
  protected async generateMessage(messageType: string): Promise<string> {
    const reportType = messageType as "daily" | "monthly" | "upcoming";
    return await generateBirthdayMessage(reportType);
  }

  /**
   * Convenience methods for better developer experience
   * These delegate to the base sendMessage method
   */

  public async sendDailyReport(channel: string): Promise<void> {
    return this.sendMessage(
      channel,
      BirthdaySlackMessageService.MESSAGE_TYPES.DAILY
    );
  }

  public async sendMonthlyReport(channel: string): Promise<void> {
    return this.sendMessage(
      channel,
      BirthdaySlackMessageService.MESSAGE_TYPES.MONTHLY
    );
  }

  public async sendUpcomingReport(channel: string): Promise<void> {
    return this.sendMessage(
      channel,
      BirthdaySlackMessageService.MESSAGE_TYPES.UPCOMING
    );
  }

  /**
   * Custom validation for birthday-specific requirements
   */
  protected async validateInputs(
    channel: string,
    messageType: string
  ): Promise<void> {
    // Call parent validation first
    await super.validateInputs(channel, messageType);

    // Add birthday-specific validation if needed
    // For example, we could validate that we have birthday data available
    // or that the channel is appropriate for birthday messages
  }
}

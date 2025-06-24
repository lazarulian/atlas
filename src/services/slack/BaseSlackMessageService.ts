import logger from "../../config/logger";
import SlackService from "../SlackService";

/**
 * Abstract base class for all Slack message services
 * Provides common functionality and enforces consistent patterns
 * 
 * This follows the Template Method pattern where the base class defines
 * the algorithm structure and subclasses implement specific steps
 */
export abstract class BaseSlackMessageService {
  protected slackService: SlackService;
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.slackService = SlackService.getInstance();
    this.serviceName = serviceName;
  }

  /**
   * Template method that defines the algorithm for sending messages
   * Subclasses cannot override this method - they must implement the abstract methods
   */
  public async sendMessage(channel: string, messageType: string, ...args: any[]): Promise<void> {
    try {
      this.logStart(messageType);
      
      // Validate inputs (hook for subclasses)
      await this.validateInputs(channel, messageType, ...args);
      
      // Generate message content (implemented by subclasses)
      const message = await this.generateMessage(messageType, ...args);
      
      // Send message (common functionality)
      await this.slackService.postMessage(channel, message);
      
      this.logSuccess(messageType);
    } catch (error) {
      this.logError(messageType, error);
      throw error;
    }
  }

  /**
   * Batch send multiple messages (common functionality)
   */
  public async sendBatchMessages(
    channel: string, 
    messages: Array<{ type: string; args: any[] }>
  ): Promise<void> {
    const results = await Promise.allSettled(
      messages.map(({ type, args }) => this.sendMessage(channel, type, ...args))
    );

    const failures = results.filter((result): result is PromiseRejectedResult => 
      result.status === 'rejected'
    );

    if (failures.length > 0) {
      logger.warn(`${this.serviceName}: ${failures.length}/${messages.length} messages failed to send`);
      failures.forEach((failure, index) => {
        logger.error(`${this.serviceName}: Batch message ${index} failed:`, failure.reason);
      });
    }

    logger.info(`${this.serviceName}: Sent ${results.length - failures.length}/${messages.length} messages successfully`);
  }

  /**
   * Get available message types for this service
   */
  public abstract getAvailableMessageTypes(): string[];

  /**
   * Validate message type is supported
   */
  protected validateMessageType(messageType: string): void {
    const availableTypes = this.getAvailableMessageTypes();
    if (!availableTypes.includes(messageType)) {
      throw new Error(
        `${this.serviceName}: Unsupported message type '${messageType}'. Available types: ${availableTypes.join(', ')}`
      );
    }
  }

  // Abstract methods that subclasses MUST implement
  
  /**
   * Generate the message content for the specified type
   * This is where domain-specific logic lives
   */
  protected abstract generateMessage(messageType: string, ...args: any[]): Promise<string>;

  /**
   * Validate inputs for the specific service
   * Subclasses can override this for custom validation
   */
  protected async validateInputs(channel: string, messageType: string, ...args: any[]): Promise<void> {
    if (!channel || typeof channel !== 'string') {
      throw new Error(`${this.serviceName}: Invalid channel name`);
    }
    
    this.validateMessageType(messageType);
  }

  // Protected logging methods for consistent logging patterns
  
  protected logStart(messageType: string): void {
    logger.info(`${this.serviceName}: Sending ${messageType} message to Slack`);
  }

  protected logSuccess(messageType: string): void {
    logger.info(`${this.serviceName}: ${messageType} message sent successfully`);
  }

  protected logError(messageType: string, error: unknown): void {
    logger.error(`${this.serviceName}: Failed to send ${messageType} message:`, error);
  }

  /**
   * Get service name for debugging and logging
   */
  public getServiceName(): string {
    return this.serviceName;
  }
} 
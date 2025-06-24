import { BaseSlackMessageService } from "./BaseSlackMessageService";
import { BirthdaySlackMessageService } from "./BirthdaySlackMessageService";

/**
 * Factory for managing domain-specific Slack message services
 * Provides centralized access to all Slack services while maintaining separation of concerns
 * 
 * This follows the Factory pattern and Service Locator pattern
 */
export class SlackMessageServiceFactory {
  private static instance: SlackMessageServiceFactory;
  private services: Map<string, BaseSlackMessageService> = new Map();

  // Service type constants for type safety
  public static readonly SERVICE_TYPES = {
    BIRTHDAY: 'birthday',
    // Add more service types as they're implemented
    // PROFILE: 'profile',
    // REMINDER: 'reminder',
    // NOTIFICATION: 'notification'
  } as const;

  private constructor() {
    this.initializeServices();
  }

  /**
   * Singleton pattern - get the factory instance
   */
  public static getInstance(): SlackMessageServiceFactory {
    if (!SlackMessageServiceFactory.instance) {
      SlackMessageServiceFactory.instance = new SlackMessageServiceFactory();
    }
    return SlackMessageServiceFactory.instance;
  }

  /**
   * Initialize all available services
   * This is where we register all domain-specific services
   */
  private initializeServices(): void {
    this.services.set(
      SlackMessageServiceFactory.SERVICE_TYPES.BIRTHDAY,
      BirthdaySlackMessageService.getInstance()
    );

    // Future services can be added here:
    // this.services.set(SERVICE_TYPES.PROFILE, ProfileSlackMessageService.getInstance());
    // this.services.set(SERVICE_TYPES.REMINDER, ReminderSlackMessageService.getInstance());
  }

  /**
   * Get a specific service by type
   * Returns the concrete service for domain-specific operations
   */
  public getService<T extends BaseSlackMessageService>(
    serviceType: keyof typeof SlackMessageServiceFactory.SERVICE_TYPES
  ): T {
    const serviceKey = SlackMessageServiceFactory.SERVICE_TYPES[serviceType];
    const service = this.services.get(serviceKey);
    
    if (!service) {
      throw new Error(`Service '${serviceKey}' not found. Available services: ${this.getAvailableServices().join(', ')}`);
    }

    return service as T;
  }

  /**
   * Convenience method to get the birthday service
   * Provides type safety and better developer experience
   */
  public getBirthdayService(): BirthdaySlackMessageService {
    return this.getService<BirthdaySlackMessageService>('BIRTHDAY');
  }

  /**
   * Get all available services
   */
  public getAvailableServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get all services that support a specific message type
   * Useful for cross-service operations
   */
  public getServicesThatSupport(messageType: string): BaseSlackMessageService[] {
    return Array.from(this.services.values()).filter(service =>
      service && service.getAvailableMessageTypes().includes(messageType)
    );
  }

  /**
   * Send a message using the appropriate service
   * Automatically determines which service to use based on message type
   */
  public async sendMessage(
    channel: string,
    serviceType: keyof typeof SlackMessageServiceFactory.SERVICE_TYPES,
    messageType: string,
    ...args: any[]
  ): Promise<void> {
    const service = this.getService(serviceType);
    return service.sendMessage(channel, messageType, ...args);
  }

  /**
   * Get service information for debugging/monitoring
   */
  public getServiceInfo(): Array<{
    type: string;
    name: string;
    availableMessageTypes: string[];
  }> {
    return Array.from(this.services.entries())
      .filter(([_, service]) => service) // Filter out null services
      .map(([type, service]) => ({
        type,
        name: service.getServiceName(),
        availableMessageTypes: service.getAvailableMessageTypes()
      }));
  }

  /**
   * Health check for all services
   * Useful for monitoring and debugging
   */
  public healthCheck(): {
    status: 'healthy' | 'degraded';
    services: Array<{
      type: string;
      name: string;
      status: 'available' | 'unavailable';
    }>;
  } {
    const serviceStatuses = Array.from(this.services.entries()).map(([type, service]) => ({
      type,
      name: service ? service.getServiceName() : 'Unknown',
      status: service ? 'available' as const : 'unavailable' as const
    }));

    const allHealthy = serviceStatuses.every(s => s.status === 'available');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services: serviceStatuses
    };
  }
} 
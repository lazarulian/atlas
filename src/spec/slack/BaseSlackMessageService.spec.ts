import { BaseSlackMessageService } from "../../services/slack/BaseSlackMessageService";
import SlackService from "../../services/SlackService";

// Mock dependencies
jest.mock("../../services/SlackService");

// Concrete test implementation of the abstract base class
class TestSlackMessageService extends BaseSlackMessageService {
  constructor() {
    super('TestSlackService');
  }

  public getAvailableMessageTypes(): string[] {
    return ['test', 'mock'];
  }

  protected async generateMessage(messageType: string, ...args: any[]): Promise<string> {
    if (messageType === 'test') {
      return `Test message with args: ${args.join(', ')}`;
    }
    if (messageType === 'mock') {
      return 'Mock message';
    }
    throw new Error(`Unsupported message type: ${messageType}`);
  }
}

const mockSlackService = {
  postMessage: jest.fn(),
};

describe("BaseSlackMessageService", () => {
  let testService: TestSlackMessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    (SlackService.getInstance as jest.Mock).mockReturnValue(mockSlackService);
    testService = new TestSlackMessageService();
  });

  describe("Constructor and Basic Methods", () => {
    test("should initialize with service name", () => {
      expect(testService.getServiceName()).toBe('TestSlackService');
    });

    test("should return available message types", () => {
      const types = testService.getAvailableMessageTypes();
      expect(types).toEqual(['test', 'mock']);
    });
  });

  describe("sendMessage", () => {
    test("should send message successfully", async () => {
      mockSlackService.postMessage.mockResolvedValue(undefined);

      await testService.sendMessage('#test-channel', 'test', 'arg1', 'arg2');

      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        '#test-channel',
        'Test message with args: arg1, arg2'
      );
    });

    test("should validate channel name", async () => {
      await expect(testService.sendMessage('', 'test')).rejects.toThrow(
        'TestSlackService: Invalid channel name'
      );

      await expect(testService.sendMessage(null as any, 'test')).rejects.toThrow(
        'TestSlackService: Invalid channel name'
      );
    });

    test("should validate message type", async () => {
      await expect(testService.sendMessage('#test', 'invalid')).rejects.toThrow(
        'TestSlackService: Unsupported message type \'invalid\'. Available types: test, mock'
      );
    });

    test("should handle message generation errors", async () => {
      // Create a service that throws during message generation
      class FailingTestService extends BaseSlackMessageService {
        constructor() {
          super('FailingTestService');
        }

        public getAvailableMessageTypes(): string[] {
          return ['fail'];
        }

        protected async generateMessage(messageType: string): Promise<string> {
          throw new Error('Message generation failed');
        }
      }

      const failingService = new FailingTestService();
      await expect(failingService.sendMessage('#test', 'fail')).rejects.toThrow(
        'Message generation failed'
      );
    });

    test("should handle Slack API errors", async () => {
      mockSlackService.postMessage.mockRejectedValue(new Error('Slack API error'));

      await expect(testService.sendMessage('#test', 'test')).rejects.toThrow(
        'Slack API error'
      );
    });
  });

  describe("sendBatchMessages", () => {
    test("should send multiple messages successfully", async () => {
      mockSlackService.postMessage.mockResolvedValue(undefined);

      const messages = [
        { type: 'test', args: ['batch1'] },
        { type: 'mock', args: [] },
        { type: 'test', args: ['batch2'] }
      ];

      await testService.sendBatchMessages('#test-channel', messages);

      expect(mockSlackService.postMessage).toHaveBeenCalledTimes(3);
      expect(mockSlackService.postMessage).toHaveBeenNthCalledWith(
        1, '#test-channel', 'Test message with args: batch1'
      );
      expect(mockSlackService.postMessage).toHaveBeenNthCalledWith(
        2, '#test-channel', 'Mock message'
      );
      expect(mockSlackService.postMessage).toHaveBeenNthCalledWith(
        3, '#test-channel', 'Test message with args: batch2'
      );
    });

    test("should handle partial failures in batch", async () => {
      mockSlackService.postMessage
        .mockResolvedValueOnce(undefined) // First succeeds
        .mockRejectedValueOnce(new Error('Second fails')) // Second fails
        .mockResolvedValueOnce(undefined); // Third succeeds

      const messages = [
        { type: 'test', args: ['msg1'] },
        { type: 'test', args: ['msg2'] },
        { type: 'test', args: ['msg3'] }
      ];

      // Should not throw, but log the failures
      await testService.sendBatchMessages('#test-channel', messages);

      expect(mockSlackService.postMessage).toHaveBeenCalledTimes(3);
    });

    test("should handle empty batch", async () => {
      await testService.sendBatchMessages('#test-channel', []);
      expect(mockSlackService.postMessage).not.toHaveBeenCalled();
    });
  });

  describe("validateMessageType", () => {
    test("should accept valid message types", () => {
      expect(() => testService['validateMessageType']('test')).not.toThrow();
      expect(() => testService['validateMessageType']('mock')).not.toThrow();
    });

    test("should reject invalid message types", () => {
      expect(() => testService['validateMessageType']('invalid')).toThrow(
        'TestSlackService: Unsupported message type \'invalid\'. Available types: test, mock'
      );
    });
  });
}); 
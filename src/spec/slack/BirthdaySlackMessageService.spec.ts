import { BirthdaySlackMessageService } from "../../services/slack/BirthdaySlackMessageService";
import SlackService from "../../services/SlackService";
import { generateBirthdayMessage } from "../../services/BirthdayReminderService";

// Mock dependencies
jest.mock("../../services/SlackService");
jest.mock("../../services/BirthdayReminderService");

const mockSlackService = {
  postMessage: jest.fn(),
};

const mockGenerateBirthdayMessage =
  generateBirthdayMessage as jest.MockedFunction<
    typeof generateBirthdayMessage
  >;

describe("BirthdaySlackMessageService", () => {
  let birthdayService: BirthdaySlackMessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    (SlackService.getInstance as jest.Mock).mockReturnValue(mockSlackService);
    birthdayService = BirthdaySlackMessageService.getInstance();
    mockGenerateBirthdayMessage.mockResolvedValue("Test birthday message");
  });

  describe("Singleton Pattern", () => {
    test("should return the same instance when called multiple times", () => {
      const instance1 = BirthdaySlackMessageService.getInstance();
      const instance2 = BirthdaySlackMessageService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test("should return the same instance as the first one", () => {
      expect(BirthdaySlackMessageService.getInstance()).toBe(birthdayService);
    });
  });

  describe("Service Configuration", () => {
    test("should have correct service name", () => {
      expect(birthdayService.getServiceName()).toBe("BirthdaySlackService");
    });

    test("should return correct available message types", () => {
      const types = birthdayService.getAvailableMessageTypes();
      expect(types).toEqual(["daily", "monthly", "upcoming"]);
    });

    test("should have MESSAGE_TYPES constants", () => {
      expect(BirthdaySlackMessageService.MESSAGE_TYPES.DAILY).toBe("daily");
      expect(BirthdaySlackMessageService.MESSAGE_TYPES.MONTHLY).toBe("monthly");
      expect(BirthdaySlackMessageService.MESSAGE_TYPES.UPCOMING).toBe(
        "upcoming"
      );
    });
  });

  describe("generateMessage", () => {
    test("should generate daily message", async () => {
      mockGenerateBirthdayMessage.mockResolvedValue("Daily birthday message");

      // Access the protected method through sendMessage
      await birthdayService.sendMessage("#test", "daily");

      expect(mockGenerateBirthdayMessage).toHaveBeenCalledWith("daily");
      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        "#test",
        "Daily birthday message"
      );
    });

    test("should generate monthly message", async () => {
      mockGenerateBirthdayMessage.mockResolvedValue("Monthly birthday message");

      await birthdayService.sendMessage("#test", "monthly");

      expect(mockGenerateBirthdayMessage).toHaveBeenCalledWith("monthly");
      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        "#test",
        "Monthly birthday message"
      );
    });

    test("should generate upcoming message", async () => {
      mockGenerateBirthdayMessage.mockResolvedValue(
        "Upcoming birthday message"
      );

      await birthdayService.sendMessage("#test", "upcoming");

      expect(mockGenerateBirthdayMessage).toHaveBeenCalledWith("upcoming");
      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        "#test",
        "Upcoming birthday message"
      );
    });
  });

  describe("Convenience Methods", () => {
    test("should send daily report", async () => {
      mockSlackService.postMessage.mockResolvedValue(undefined);
      mockGenerateBirthdayMessage.mockResolvedValue("Daily message");

      await birthdayService.sendDailyReport("#birthdays");

      expect(mockGenerateBirthdayMessage).toHaveBeenCalledWith("daily");
      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        "#birthdays",
        "Daily message"
      );
    });

    test("should send monthly report", async () => {
      mockSlackService.postMessage.mockResolvedValue(undefined);
      mockGenerateBirthdayMessage.mockResolvedValue("Monthly message");

      await birthdayService.sendMonthlyReport("#birthdays");

      expect(mockGenerateBirthdayMessage).toHaveBeenCalledWith("monthly");
      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        "#birthdays",
        "Monthly message"
      );
    });

    test("should send upcoming report", async () => {
      mockSlackService.postMessage.mockResolvedValue(undefined);
      mockGenerateBirthdayMessage.mockResolvedValue("Upcoming message");

      await birthdayService.sendUpcomingReport("#birthdays");

      expect(mockGenerateBirthdayMessage).toHaveBeenCalledWith("upcoming");
      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        "#birthdays",
        "Upcoming message"
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid message type", async () => {
      await expect(
        birthdayService.sendMessage("#test", "invalid")
      ).rejects.toThrow(
        "BirthdaySlackService: Unsupported message type 'invalid'. Available types: daily, monthly, upcoming"
      );
    });

    test("should handle message generation errors", async () => {
      mockGenerateBirthdayMessage.mockRejectedValue(
        new Error("Message generation failed")
      );

      await expect(birthdayService.sendDailyReport("#test")).rejects.toThrow(
        "Message generation failed"
      );
    });

    test("should handle Slack API errors", async () => {
      mockGenerateBirthdayMessage.mockResolvedValue("Test message");
      mockSlackService.postMessage.mockRejectedValue(
        new Error("Slack API error")
      );

      await expect(birthdayService.sendDailyReport("#test")).rejects.toThrow(
        "Slack API error"
      );
    });

    test("should validate channel name", async () => {
      await expect(birthdayService.sendDailyReport("")).rejects.toThrow(
        "BirthdaySlackService: Invalid channel name"
      );
    });
  });

  describe("Integration with Base Class", () => {
    test("should use base class sendMessage method", async () => {
      mockSlackService.postMessage.mockResolvedValue(undefined);
      mockGenerateBirthdayMessage.mockResolvedValue("Generated message");

      // This tests that the convenience method properly delegates to the base class
      await birthdayService.sendDailyReport("#test");

      expect(mockSlackService.postMessage).toHaveBeenCalledWith(
        "#test",
        "Generated message"
      );
    });

    test("should inherit batch messaging functionality", async () => {
      mockSlackService.postMessage.mockResolvedValue(undefined);
      mockGenerateBirthdayMessage.mockResolvedValue("Test message");

      const messages = [
        { type: "daily", args: [] },
        { type: "monthly", args: [] },
      ];

      await birthdayService.sendBatchMessages("#test", messages);

      expect(mockSlackService.postMessage).toHaveBeenCalledTimes(2);
    });
  });
});

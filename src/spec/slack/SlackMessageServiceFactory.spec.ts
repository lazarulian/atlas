import { SlackMessageServiceFactory } from "../../services/slack/SlackMessageServiceFactory";
import { BirthdaySlackMessageService } from "../../services/slack/BirthdaySlackMessageService";
import SlackService from "../../services/SlackService";

// Mock dependencies
jest.mock("../../services/SlackService");
jest.mock("../../services/slack/BirthdaySlackMessageService");

const mockSlackService = {
  postMessage: jest.fn(),
};

const mockBirthdayService = {
  getServiceName: jest.fn(() => "BirthdaySlackService"),
  getAvailableMessageTypes: jest.fn(() => ["daily", "monthly", "upcoming"]),
  sendMessage: jest.fn(),
  sendDailyReport: jest.fn(),
  sendMonthlyReport: jest.fn(),
  sendUpcomingReport: jest.fn(),
};

describe("SlackMessageServiceFactory", () => {
  let factory: SlackMessageServiceFactory;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the singleton instance before each test
    (SlackMessageServiceFactory as any).instance = null;

    (SlackService.getInstance as jest.Mock).mockReturnValue(mockSlackService);
    (BirthdaySlackMessageService.getInstance as jest.Mock).mockReturnValue(
      mockBirthdayService
    );

    factory = SlackMessageServiceFactory.getInstance();
  });

  describe("Singleton Pattern", () => {
    test("should return the same instance when called multiple times", () => {
      const instance1 = SlackMessageServiceFactory.getInstance();
      const instance2 = SlackMessageServiceFactory.getInstance();
      expect(instance1).toBe(instance2);
    });

    test("should return the same instance as the first one", () => {
      expect(SlackMessageServiceFactory.getInstance()).toBe(factory);
    });
  });

  describe("Service Type Constants", () => {
    test("should have correct service type constants", () => {
      expect(SlackMessageServiceFactory.SERVICE_TYPES.BIRTHDAY).toBe(
        "birthday"
      );
    });
  });

  describe("getService", () => {
    test("should return birthday service", () => {
      const service = factory.getService("BIRTHDAY");
      expect(service).toBe(mockBirthdayService);
    });

    test("should throw error for non-existent service", () => {
      expect(() => factory.getService("NONEXISTENT" as any)).toThrow(
        "Service 'undefined' not found. Available services: birthday"
      );
    });
  });

  describe("getBirthdayService", () => {
    test("should return birthday service directly", () => {
      const service = factory.getBirthdayService();
      expect(service).toBe(mockBirthdayService);
    });

    test("should return strongly typed birthday service", () => {
      const service = factory.getBirthdayService();
      // This should have all the birthday-specific methods
      expect(typeof service.sendDailyReport).toBe("function");
      expect(typeof service.sendMonthlyReport).toBe("function");
      expect(typeof service.sendUpcomingReport).toBe("function");
    });
  });

  describe("getAvailableServices", () => {
    test("should return list of available services", () => {
      const services = factory.getAvailableServices();
      expect(services).toEqual(["birthday"]);
    });
  });

  describe("getServicesThatSupport", () => {
    test("should return services that support specific message type", () => {
      const services = factory.getServicesThatSupport("daily");
      expect(services).toEqual([mockBirthdayService]);
      expect(mockBirthdayService.getAvailableMessageTypes).toHaveBeenCalled();
    });

    test("should return empty array for unsupported message type", () => {
      mockBirthdayService.getAvailableMessageTypes.mockReturnValueOnce([
        "other",
      ]);
      const services = factory.getServicesThatSupport("unsupported");
      expect(services).toEqual([]);
    });

    test("should filter services correctly", () => {
      // Mock multiple services supporting different message types
      const anotherService = {
        getServiceName: () => "AnotherService",
        getAvailableMessageTypes: () => ["other", "test"],
        sendMessage: jest.fn(),
      };

      // Manually add another service for testing
      factory["services"].set("test", anotherService as any);

      // Reset the mocks for this specific test
      mockBirthdayService.getAvailableMessageTypes.mockReturnValue([
        "daily",
        "monthly",
        "upcoming",
      ]);

      const dailyServices = factory.getServicesThatSupport("daily");
      const otherServices = factory.getServicesThatSupport("other");

      expect(dailyServices).toEqual([mockBirthdayService]);
      expect(otherServices).toEqual([anotherService]);
    });
  });

  describe("sendMessage", () => {
    test("should delegate to correct service", async () => {
      mockBirthdayService.sendMessage.mockResolvedValue(undefined);

      await factory.sendMessage("#test", "BIRTHDAY", "daily");

      expect(mockBirthdayService.sendMessage).toHaveBeenCalledWith(
        "#test",
        "daily"
      );
    });

    test("should pass additional arguments", async () => {
      mockBirthdayService.sendMessage.mockResolvedValue(undefined);

      await factory.sendMessage("#test", "BIRTHDAY", "daily", "arg1", "arg2");

      expect(mockBirthdayService.sendMessage).toHaveBeenCalledWith(
        "#test",
        "daily",
        "arg1",
        "arg2"
      );
    });

    test("should handle service errors", async () => {
      mockBirthdayService.sendMessage.mockRejectedValue(
        new Error("Service error")
      );

      await expect(
        factory.sendMessage("#test", "BIRTHDAY", "daily")
      ).rejects.toThrow("Service error");
    });
  });

  describe("getServiceInfo", () => {
    test("should return service information", () => {
      const info = factory.getServiceInfo();

      expect(info).toEqual([
        {
          type: "birthday",
          name: "BirthdaySlackService",
          availableMessageTypes: ["daily", "monthly", "upcoming"],
        },
      ]);

      expect(mockBirthdayService.getServiceName).toHaveBeenCalled();
      expect(mockBirthdayService.getAvailableMessageTypes).toHaveBeenCalled();
    });

    test("should return info for multiple services", () => {
      // Add another service for testing
      const anotherService = {
        getServiceName: () => "TestService",
        getAvailableMessageTypes: () => ["test"],
        sendMessage: jest.fn(),
      };

      factory["services"].set("test", anotherService as any);

      const info = factory.getServiceInfo();
      expect(info).toHaveLength(2);
      expect(info[0].type).toBe("birthday");
      expect(info[1].type).toBe("test");
    });

    test("should filter out null services", () => {
      // Add a null service
      factory["services"].set("broken", null as any);

      const info = factory.getServiceInfo();

      // Should only return the birthday service, not the null one
      expect(info).toHaveLength(1);
      expect(info[0].type).toBe("birthday");
    });
  });

  describe("healthCheck", () => {
    test("should return healthy status when all services available", () => {
      const health = factory.healthCheck();

      expect(health.status).toBe("healthy");
      expect(health.services).toEqual([
        {
          type: "birthday",
          name: "BirthdaySlackService",
          status: "available",
        },
      ]);
    });

    test("should return degraded status with unavailable services", () => {
      // Simulate an unavailable service
      factory["services"].set("broken", null as any);

      const health = factory.healthCheck();

      expect(health.status).toBe("degraded");
      expect(health.services).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "broken",
            name: "Unknown",
            status: "unavailable",
          }),
        ])
      );
    });

    test("should handle mixed service availability", () => {
      const workingService = {
        getServiceName: () => "WorkingService",
        getAvailableMessageTypes: () => ["test"],
        sendMessage: jest.fn(),
      };

      factory["services"].set("working", workingService as any);
      factory["services"].set("broken", null as any);

      const health = factory.healthCheck();

      expect(health.status).toBe("degraded");
      expect(health.services).toHaveLength(3); // birthday, working, broken

      const workingStatus = health.services.find((s) => s.type === "working");
      const brokenStatus = health.services.find((s) => s.type === "broken");

      expect(workingStatus?.status).toBe("available");
      expect(brokenStatus?.status).toBe("unavailable");
    });
  });

  describe("Service Registration", () => {
    test("should initialize birthday service on construction", () => {
      // This should have been called when the factory was instantiated
      expect(BirthdaySlackMessageService.getInstance).toHaveBeenCalled();
    });

    test("should have birthday service in services map", () => {
      const services = factory.getAvailableServices();
      expect(services).toContain("birthday");
    });
  });
});

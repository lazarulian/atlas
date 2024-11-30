// SlackService.test.ts

import SlackService from "../services/SlackService";
import { WebClient } from "@slack/web-api";
import logger from "../config/logger";

jest.mock("@slack/web-api");
jest.mock("../config/logger");

describe("SlackService", () => {
  const mockSlackToken = "xoxb-1234567890-0987654321-abcdefghijklmnop";
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, SLACK_TOKEN: mockSlackToken };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("should post a message successfully", async () => {
    // Mock the Slack API methods
    const mockPostMessage = jest
      .fn()
      .mockResolvedValue({ ts: "1234567890.123456" });
    (WebClient.prototype as any).chat = { postMessage: mockPostMessage };

    const slackService = SlackService.getInstance();

    await slackService.postMessage("general", "Hello, Slack!");

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: "general",
      text: "Hello, Slack!",
    });

    expect(logger.info).toHaveBeenCalledWith(
      `Message successfully posted to general: 1234567890.123456`
    );
  });

  test("should return the same instance", () => {
    const instance1 = SlackService.getInstance();
    const instance2 = SlackService.getInstance();

    expect(instance1).toBe(instance2);
  });
});

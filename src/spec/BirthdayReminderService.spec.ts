import {
  getBirthdayReport,
  getMonthlyBirthdays,
  getUpcomingBirthdays,
  getBirthdayReports,
  generateBirthdayMessage,
} from "../services/BirthdayReminderService";
import { PeopleAttributes } from "../types/models/PeopleInterface";
import { createPerson } from "../utils/ModelService";

// Mock the People model
jest.mock("../models/People", () => ({
  People: {
    findAll: jest.fn(),
  },
}));

import { People } from "../models/People";
const mockPeople = People as jest.Mocked<typeof People>;

describe("Birthday Reminder Service", () => {
  const people: PeopleAttributes[] = [
    createPerson({
      id: 1,
      name: "Daenerys Targaryen",
      birthday: new Date("1995-11-28"), // Birthday: Nov 28
      yearMet: 2015,
      phoneNumber: "123-456-7890",
      location: ["Westeros"],
    }),
    createPerson({
      id: 2,
      name: "Omar Little",
      birthday: new Date("1990-11-28"), // Birthday: Nov 28
      yearMet: 2018,
      phoneNumber: "987-654-3210",
      location: ["Baltimore"],
    }),
    createPerson({
      id: 3,
      name: "Frank Ocean",
      birthday: new Date("1985-06-15"), // Birthday: Jun 15
      yearMet: 2010,
      phoneNumber: "555-555-5555",
    }),
    createPerson({
      id: 4,
      name: "Daniel Caesar",
      birthday: new Date("1992-02-29"), // Birthday: Feb 29 (leap)
      yearMet: 2012,
      phoneNumber: "444-444-4444",
      email: "daniel@example.com",
      location: ["Toronto", "London"],
    }),
    createPerson({
      id: 5,
      name: "John Doe",
      birthday: new Date("1988-12-25"), // Birthday: Dec 25
      yearMet: 2020,
      phoneNumber: "111-111-1111",
    }),
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    mockPeople.findAll.mockResolvedValue(people as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("getBirthdayReport", () => {
    test("should return reports for people whose birthday is today", () => {
      // Simulate today as 2024-11-28.
      jest.setSystemTime(new Date("2024-11-28T12:00:00Z"));
      const reports = getBirthdayReport(people);
      expect(reports).toHaveLength(2);
      expect(reports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Daenerys Targaryen",
            yearsInContact: 2024 - 2015,
          }),
          expect.objectContaining({
            name: "Omar Little",
            yearsInContact: 2024 - 2018,
          }),
        ])
      );
    });

    test("should return report for one person with a birthday today", () => {
      // Simulate today as 2024-06-15.
      jest.setSystemTime(new Date("2024-06-15T12:00:00Z"));
      const reports = getBirthdayReport(people);
      expect(reports).toHaveLength(1);
      expect(reports[0]).toEqual(
        expect.objectContaining({
          name: "Frank Ocean",
          yearsInContact: 2024 - 2010,
        })
      );
    });

    test("should return an empty array if no birthdays match today", () => {
      // Simulate today as 2024-01-01.
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
      const reports = getBirthdayReport(people);
      expect(reports).toEqual([]);
    });

    test("should not report leap year birthdays on non-leap years", () => {
      // Simulate today as 2023-02-28 (non-leap)
      jest.setSystemTime(new Date("2023-02-28T12:00:00Z"));
      const reports = getBirthdayReport(people);
      expect(reports).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Daniel Caesar" }),
        ])
      );
    });

    test("should handle leap year birthdays on leap years", () => {
      // Simulate today as 2024-02-29 (leap year)
      jest.setSystemTime(new Date("2024-02-29T12:00:00Z"));
      const reports = getBirthdayReport(people);
      expect(reports).toHaveLength(1);
      expect(reports[0]).toEqual(
        expect.objectContaining({
          name: "Daniel Caesar",
          yearsInContact: 2024 - 2012,
        })
      );
    });
  });

  describe("getMonthlyBirthdays", () => {
    test("should return all birthdays in the current month", () => {
      // Simulate today as 2024-11-15.
      jest.setSystemTime(new Date("2024-11-15T12:00:00Z"));
      const reports = getMonthlyBirthdays(people);
      expect(reports).toHaveLength(2);
      expect(reports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Daenerys Targaryen" }),
          expect.objectContaining({ name: "Omar Little" }),
        ])
      );
    });

    test("should return an empty array if no birthdays are in the current month", () => {
      // Simulate today as 2024-03-15 (March)
      jest.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      const reports = getMonthlyBirthdays(people);
      expect(reports).toEqual([]);
    });

    test("should return December birthdays in December", () => {
      // Simulate today as 2024-12-15
      jest.setSystemTime(new Date("2024-12-15T12:00:00Z"));
      const reports = getMonthlyBirthdays(people);
      expect(reports).toHaveLength(1);
      expect(reports[0]).toEqual(expect.objectContaining({ name: "John Doe" }));
    });
  });

  describe("getUpcomingBirthdays", () => {
    test("should return the next upcoming birthday reports", () => {
      // Simulate today as 2024-11-27.
      jest.setSystemTime(new Date("2024-11-27T12:00:00Z"));
      const reports = getUpcomingBirthdays(people);
      expect(reports).toHaveLength(2);
      expect(reports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Daenerys Targaryen" }),
          expect.objectContaining({ name: "Omar Little" }),
        ])
      );
    });

    test("should return the correct upcoming birthday when today is late in the year", () => {
      // Simulate today as 2024-12-30.
      jest.setSystemTime(new Date("2024-12-30T12:00:00Z"));
      const reports = getUpcomingBirthdays(people);
      expect(reports).toHaveLength(1);
      expect(reports[0]).toEqual(
        expect.objectContaining({ name: "Daniel Caesar" })
      );
      const bdStr = reports[0].birthday?.toISOString().substring(5, 10);
      expect(bdStr).toBe("02-29");
    });

    test("should return an empty array if no birthdays exist", () => {
      const reports = getUpcomingBirthdays([]);
      expect(reports).toEqual([]);
    });
  });

  describe("getBirthdayReports", () => {
    test("should return daily reports", async () => {
      jest.setSystemTime(new Date("2024-11-28T12:00:00Z"));
      const reports = await getBirthdayReports("daily");
      expect(reports).toHaveLength(2);
      expect(reports.map((r) => r.name)).toEqual(
        expect.arrayContaining(["Daenerys Targaryen", "Omar Little"])
      );
    });

    test("should return monthly reports", async () => {
      jest.setSystemTime(new Date("2024-11-15T12:00:00Z"));
      const reports = await getBirthdayReports("monthly");
      expect(reports).toHaveLength(2);
      expect(reports.map((r) => r.name)).toEqual(
        expect.arrayContaining(["Daenerys Targaryen", "Omar Little"])
      );
    });

    test("should return upcoming reports", async () => {
      jest.setSystemTime(new Date("2024-11-27T12:00:00Z"));
      const reports = await getBirthdayReports("upcoming");
      expect(reports).toHaveLength(2);
      expect(reports.map((r) => r.name)).toEqual(
        expect.arrayContaining(["Daenerys Targaryen", "Omar Little"])
      );
    });

    test("should throw error for invalid type", async () => {
      await expect(getBirthdayReports("invalid" as any)).rejects.toThrow(
        "Invalid report type: invalid"
      );
    });

    test("should return empty array when no contacts found", async () => {
      mockPeople.findAll.mockResolvedValue([]);
      const reports = await getBirthdayReports("daily");
      expect(reports).toEqual([]);
    });
  });

  describe("generateBirthdayMessage", () => {
    test("should generate daily message with birthdays", async () => {
      jest.setSystemTime(new Date("2024-11-28T12:00:00Z"));
      const message = await generateBirthdayMessage("daily");

      expect(message).toContain("🎉 Daily Birthday Report 🎉");
      expect(message).toContain("Birthdays Today:");
      expect(message).toContain("Daenerys Targaryen");
      expect(message).toContain("Omar Little");
      expect(message).toContain("Don't forget to send your wishes!");
      expect(message).toContain("November 28");
    });

    test("should generate empty daily message", async () => {
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
      const message = await generateBirthdayMessage("daily");

      expect(message).toContain("🎉 Daily Birthday Report 🎉");
      expect(message).toContain("No birthdays today!");
    });

    test("should generate monthly message", async () => {
      jest.setSystemTime(new Date("2024-11-15T12:00:00Z"));
      const message = await generateBirthdayMessage("monthly");

      expect(message).toContain("📅 Monthly Birthday Report 📅");
      expect(message).toContain("Birthdays This Month:");
      expect(message).toContain("Mark your calendars!");
    });

    test("should generate upcoming message", async () => {
      jest.setSystemTime(new Date("2024-11-27T12:00:00Z"));
      const message = await generateBirthdayMessage("upcoming");

      expect(message).toContain("🔮 Next Upcoming Birthday 🔮");
      expect(message).toContain("Next Birthday:");
      expect(message).toContain("Get ready to celebrate!");
    });

    test("should include timestamp in all messages", async () => {
      const message = await generateBirthdayMessage("daily");
      expect(message).toMatch(/Generated at:/);
      expect(message).toMatch(/Report Generated:/);
    });

    test("should format years in contact correctly", async () => {
      jest.setSystemTime(new Date("2024-06-15T12:00:00Z"));
      const message = await generateBirthdayMessage("daily");

      expect(message).toContain("Frank Ocean");
      expect(message).toContain("Friends for 14 years"); // 2024 - 2010
    });

    test("should handle people met in current year", async () => {
      const currentYearPerson = [
        createPerson({
          id: 6,
          name: "New Friend",
          birthday: new Date("1990-01-01"),
          yearMet: 2024,
          phoneNumber: "222-222-2222",
        }),
      ];

      mockPeople.findAll.mockResolvedValue(currentYearPerson as any);
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));

      const message = await generateBirthdayMessage("daily");
      expect(message).toContain("New Friend");
      // Should not show negative years or confusing text
      expect(message).not.toContain("Friends for 0 years");
    });
  });
});

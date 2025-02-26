import {
  getBirthdayReport,
  getMonthlyBirthdays,
  getUpcomingBirthdays,
} from "../services/BirthdayReminderService";
import { PeopleAttributes } from "../types/models/PeopleInterface";
import { createPerson } from "../utils/ModelService";

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
      name: "No Birthday",
      // birthday is undefined
      yearMet: 2020,
      phoneNumber: "000-000-0000",
    }),
  ];

  describe("getBirthdayReport", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test("should return reports for people whose birthday is today", () => {
      // Simulate today as 2024-11-28.
      // Expect Daenerys and Omar (whose birthday ISO substring is "11-28")
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
      // Expect Frank Ocean
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
      // Daniel's birthday (Feb 29) should not appear on a non-leap year.
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
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test("should return all birthdays in the current month", () => {
      // Simulate today as 2024-11-15.
      // Expect all people with birthdays in November (Daenerys and Omar)
      jest.setSystemTime(new Date("2024-11-15T12:00:00Z"));
      const reports = getMonthlyBirthdays(people);
      expect(reports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Daenerys Targaryen" }),
          expect.objectContaining({ name: "Omar Little" }),
        ])
      );
      // Ensure Frank Ocean (June) and Daniel Caesar (Feb) are not included.
      expect(reports).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Frank Ocean" }),
          expect.objectContaining({ name: "Daniel Caesar" }),
        ])
      );
    });

    test("should return an empty array if no birthdays are in the current month", () => {
      // Simulate today as 2024-03-15 (March)
      jest.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      const reports = getMonthlyBirthdays(people);
      expect(reports).toEqual([]);
    });
  });

  describe("getUpcomingBirthdays", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test("should return the next upcoming birthday reports", () => {
      // Simulate today as 2024-11-27.
      // Among our sample people:
      // - Daenerys and Omar have birthday "11-28" which are the next upcoming (1128 candidate).
      // - Frank Ocean (06-15) becomes 615+1200=1815; Daniel Caesar (02-29) becomes 229+1200=1429.
      // So the minimal candidate is 1128.
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
      // Calculate candidates:
      // - Daenerys/Omar: 11-28 => candidate 1128 < today (1230), so 1128 + 1200 = 2328.
      // - Frank Ocean: 06-15 => candidate 615 < 1230, so 615 + 1200 = 1815.
      // - Daniel Caesar: 02-29 => candidate 229 < 1230, so 229 + 1200 = 1429.
      // The minimal candidate is 1429, corresponding to "02-29".
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
});

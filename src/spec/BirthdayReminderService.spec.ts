import { getBirthdayReport } from "../services/BirthdayReminderService";
import { PeopleAttributes } from "../types/models/PeopleInterface";

describe("getBirthdayReport", () => {
  const people: PeopleAttributes[] = [
    {
      id: 1,
      firstName: "Daenerys",
      lastName: "Targaryen",
      birthday: new Date("1995-11-28"),
      yearMet: 2015,
      phoneNumber: "123-456-7890",
      email: "",
      location: "Westeros",
    },
    {
      id: 2,
      firstName: "Omar",
      lastName: "Little",
      birthday: new Date("1990-11-28"),
      yearMet: 2018,
      phoneNumber: "987-654-3210",
      email: "",
      location: "Baltimore",
    },
    {
      id: 3,
      firstName: "Frank",
      lastName: "Ocean",
      birthday: new Date("1985-06-15"),
      yearMet: 2010,
      phoneNumber: "555-555-5555",
      email: "",
      location: "",
    },
    {
      id: 4,
      firstName: "Daniel",
      lastName: "Caesar",
      birthday: new Date("1992-02-29"),
      yearMet: 2012,
      phoneNumber: "444-444-4444",
      email: "daniel@example.com",
      location: "City D",
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("should return birthday reports for people whose birthday is today", () => {
    jest.setSystemTime(new Date("2024-11-28"));

    const reports = getBirthdayReport(people);

    expect(reports.length).toBe(2);

    expect(reports).toEqual([
      {
        fullName: "Daenerys Targaryen",
        yearsInContact: 9, // 2024 - 2015
      },
      {
        fullName: "Omar Little",
        yearsInContact: 6, // 2024 - 2018
      },
    ]);
  });

  test("should return birthday report for one person with a birthday today", () => {
    jest.setSystemTime(new Date("2024-06-15"));

    const reports = getBirthdayReport(people);

    expect(reports.length).toBe(1);

    expect(reports).toEqual([
      {
        fullName: "Frank Ocean",
        yearsInContact: 14, // 2024 - 2010
      },
    ]);
  });

  test("should return an empty array if no birthdays match today's date", () => {
    // Mock today's date to a day where no one has a birthday
    jest.setSystemTime(new Date("2024-01-01"));

    const reports = getBirthdayReport(people);

    expect(reports).toEqual([]);
  });

  test("should handle leap year birthdays on non-leap years", () => {
    // Mock today's date to "2023-02-28" (non-leap year)
    jest.setSystemTime(new Date("2023-02-28"));

    const reports = getBirthdayReport(people);

    // Daniel's birthday is on Feb 29, should not appear on non-leap years
    expect(reports).toEqual([]);
  });

  test("should handle leap year birthdays on leap years", () => {
    // Mock today's date to "2024-02-29" (leap year)
    jest.setSystemTime(new Date("2024-02-29"));

    const reports = getBirthdayReport(people);

    expect(reports.length).toBe(1);

    expect(reports).toEqual([
      {
        fullName: "Daniel Caesar",
        yearsInContact: 12, // 2024 - 2012
      },
    ]);
  });

  test("should correctly calculate yearsInContact", () => {
    // Mock today's date to "2024-11-28"
    jest.setSystemTime(new Date("2024-11-28"));

    const reports = getBirthdayReport(people);

    expect(reports).toEqual([
      {
        fullName: "Daenerys Targaryen",
        yearsInContact: 9, // 2024 - 2015
      },
      {
        fullName: "Omar Little",
        yearsInContact: 6, // 2024 - 2018
      },
    ]);
  });
});

import fs from "fs";
import path from "path";
import { format } from "date-fns";

import logger from "../config/logger";
import { People } from "../models/People";
import { PeopleAttributes } from "../types/models/PeopleInterface";
import { BirthdayReport } from "../types/services/BirthdayReminder";

/**
 * Generates the birthday report message to be sent via Slack.
 * @returns {Promise<string>} The formatted birthday message.
 */
export async function generateBirthdayReport(): Promise<string> {
  try {
    logger.info("Generating Birthday Report...");

    // Fetch contacts from the database.
    logger.debug("Fetching contacts...");
    const contacts = (await People.findAll({
      raw: true,
    })) as PeopleAttributes[];

    if (contacts.length === 0) {
      logger.info("No contacts found in the database.");
      return formatBirthdayMessage([], []);
    }

    const birthdayReports = getBirthdayReport(contacts);
    const monthlyBirthdays = getMonthlyBirthdays(contacts);
    const upcomingBirthdays = getUpcomingBirthdays(contacts);
    const birthdayMessage = formatBirthdayMessage(
      birthdayReports,
      upcomingBirthdays
    );

    return birthdayMessage;
  } catch (error) {
    logger.error("Error in generating Birthday Report:", error);
    throw error;
  }
}

/**
 * Formats the birthday message to be sent.
 * @param {BirthdayReport[]} reports - The report of birthdays in the current month.
 * @param {BirthdayReport[]} nextBirthdayReports - The report for the next upcoming birthday.
 * @returns {string} The formatted birthday message.
 */
function formatBirthdayMessage(
  reports: BirthdayReport[],
  nextBirthdayReports: BirthdayReport[]
): string {
  const timestamp = format(new Date(), "PPpp");
  let message = `\n\n🎉 Birthday Report 🎉\n`;

  if (reports.length > 0) {
    const birthdayList = reports
      .map(
        (report, index) =>
          `${index + 1}. ${report.name} has been your friend for ${
            report.yearsInContact
          } years. Their birthday is on ${
            report.birthday
              ? report.birthday.toISOString().substring(0, 10)
              : "N/A"
          }.`
      )
      .join("\n");
    message += `\n${birthdayList}\n`;
    message += `\nPlease make sure to wish them a happy birthday 🎂\n`;
  } else {
    message += `\nNo birthdays.!\n`;
  }

  if (nextBirthdayReports.length > 0) {
    const nextBirthdayDate =
      nextBirthdayReports[0].birthday !== undefined
        ? nextBirthdayReports[0].birthday.toISOString().substring(0, 10)
        : "N/A";
    const upcomingBirthdays = nextBirthdayReports
      .map(
        (report) =>
          `${report.name} has an upcoming birthday on ${nextBirthdayDate}.`
      )
      .join("\n");
    message += `\n${upcomingBirthdays}\n`;
  }
  message += `\nCollected at: ${timestamp}\n\n`;

  return message;
}

/**
 * Generates a report of people whose birthdays are today.
 * Compares the stored birthday’s MM-DD portion to today's local MM-DD.
 * @param {PeopleAttributes[]} people - The list of people.
 * @returns {BirthdayReport[]} The birthday reports.
 */
function getBirthdayReport(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const localMonth = (today.getMonth() + 1).toString().padStart(2, "0");
  const localDay = today.getDate().toString().padStart(2, "0");
  const todayLocal = `${localMonth}-${localDay}`; // e.g., "02-25"

  return people
    .filter((person) => {
      if (!person.birthday) return false;
      // Convert birthday to a Date.
      const bd =
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday!);
      const bdStr = bd.toISOString().substring(5, 10); // e.g., "02-26"
      return bdStr === todayLocal;
    })
    .map((person) => ({
      name: person.name,
      yearsInContact: today.getFullYear() - person.yearMet,
      birthday:
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday!),
    }));
}

/**
 * Generates a report of people whose birthdays fall in the current month.
 * Compares the stored birthday’s MM portion with today’s local month.
 * @param {PeopleAttributes[]} people - The list of people.
 * @returns {BirthdayReport[]} The birthday reports.
 */
function getMonthlyBirthdays(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0"); // e.g., "02"

  return people
    .filter((person) => {
      if (!person.birthday) return false;
      const bd =
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday!);
      const bdMonth = bd.toISOString().substring(5, 7); // e.g., "02"
      return bdMonth === currentMonth;
    })
    .map((person) => ({
      name: person.name,
      yearsInContact: today.getFullYear() - person.yearMet,
      birthday:
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday!),
    }));
}

/**
 * Generates a report of people who share the next upcoming birthday.
 * Calculates a numeric candidate for each birthday based solely on the stored MM-DD.
 * If the candidate is less than today’s local MMDD, it’s treated as next year.
 * @param {PeopleAttributes[]} people - The list of people.
 * @returns {BirthdayReport[]} The birthday reports for the next birthday.
 */
function getUpcomingBirthdays(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const todayMonth = today.getMonth() + 1; // local month (1-12)
  const todayDay = today.getDate(); // local day (1-31)
  const todayNum = todayMonth * 100 + todayDay; // e.g., Feb 25 -> 225

  let minCandidateNum = Infinity;

  for (const person of people) {
    if (!person.birthday) continue;
    const bd =
      person.birthday instanceof Date
        ? person.birthday
        : new Date(person.birthday!);
    const bdStr = bd.toISOString().substring(5, 10); // e.g., "02-26"
    const [monthStr, dayStr] = bdStr.split("-");
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    let candidateNum = month * 100 + day;
    if (candidateNum < todayNum) {
      candidateNum += 1200;
    }
    if (candidateNum < minCandidateNum) {
      minCandidateNum = candidateNum;
    }
  }

  if (minCandidateNum === Infinity) return [];

  // Normalize the candidate number back to an "MM-DD" string.
  const normalized =
    minCandidateNum >= 1200 + 100 ? minCandidateNum - 1200 : minCandidateNum;
  const upcomingMonth = Math.floor(normalized / 100)
    .toString()
    .padStart(2, "0");
  const upcomingDay = (normalized % 100).toString().padStart(2, "0");
  const upcoming = `${upcomingMonth}-${upcomingDay}`;

  return people
    .filter((person) => {
      if (!person.birthday) return false;
      const bd =
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday!);
      return bd.toISOString().substring(5, 10) === upcoming;
    })
    .map((person) => ({
      name: person.name,
      yearsInContact: today.getFullYear() - person.yearMet,
      birthday:
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday!),
    }));
}

export default generateBirthdayReport;
export { getBirthdayReport, getUpcomingBirthdays, getMonthlyBirthdays };

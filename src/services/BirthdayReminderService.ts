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

    // Fetch contacts
    logger.debug("Fetching contacts...");
    const contacts = (await People.findAll({
      raw: true,
    })) as PeopleAttributes[];

    if (contacts.length === 0) {
      logger.info("No contacts found in the database.");
      return formatBirthdayMessage([]);
    }

    const birthdayReports = getBirthdayReport(contacts);
    console.log(birthdayReports);
    const birthdayMessage = formatBirthdayMessage(birthdayReports);

    return birthdayMessage;
  } catch (error) {
    logger.error("Error in generating Birthday Report:", error);
    throw error;
  }
}

/**
 * Formats the birthday message to be sent.
 * @param {BirthdayReport[]} reports - The list of birthday reports.
 * @returns {string} The formatted birthday message.
 */
function formatBirthdayMessage(reports: BirthdayReport[]): string {
  const timestamp = format(new Date(), "PPpp");

  if (reports.length === 0) {
    return `\n\n🎉 Birthday Report 🎉\n\nNo birthdays today!\n\nCollected at: ${timestamp}`;
  }

  const header = `\n\n🎉 Birthday Report 🎉\n`;
  const footer = `\nPlease make sure to wish them a happy birthday 🎂\nCollected at: ${timestamp}\n\n`;
  const body = reports
    .map(
      (report, index) =>
        `${index + 1}. ${report.name} has been your friend for ${
          report.yearsInContact
        } years.`
    )
    .join("\n");

  return `${header}\n${body}\n${footer}`;
}

/**
 * Generates a report of people whose birthdays are today.
 * @param {PeopleAttributes[]} people - The list of people.
 * @returns {BirthdayReport[]} The birthday reports.
 */
function getBirthdayReport(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  return people
    .filter((person) => {
      if (!person.birthday) return false;

      const birthday = new Date(person.birthday);

      return (
        birthday.getUTCDate() === todayDate &&
        birthday.getUTCMonth() === todayMonth
      );
    })
    .map((person) => ({
      name: person.name,
      yearsInContact: today.getFullYear() - person.yearMet,
    }));
}

/**
 * Generates a report of people whose birthdays are in the current month.
 * @param {PeopleAttributes[]} people - The list of people.
 * @returns {BirthdayReport[]} The birthday reports.
 */
function getMonthlyBirthdayReport(
  people: PeopleAttributes[]
): BirthdayReport[] {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed (0 = January)

  return people
    .filter((person) => {
      // Ensure person.birthday is defined before checking
      if (!person.birthday) return false;
      const birthday = new Date(person.birthday);
      return birthday.getMonth() === currentMonth;
    })
    .map((person) => ({
      name: person.name, // Using `name` field
      yearsInContact: today.getFullYear() - person.yearMet,
    }));
}

export default generateBirthdayReport;
export { getBirthdayReport };

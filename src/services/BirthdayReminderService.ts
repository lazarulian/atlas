import fs from "fs";
import path from "path";
import { format } from "date-fns";

import logger from "../config/logger";
import { People } from "../models/People";
import { PeopleAttributes, Profile } from "../types/models/PeopleInterface";
import { BirthdayReport } from "../types/services/BirthdayReminder";

/**
 * Generates the birthday report message to be sent via Slack.
 * @returns {Promise<string>} The formatted birthday message.
 */
export async function generateBirthdayReport(): Promise<string> {
  try {
    logger.info("Executing daily updates...");

    // Update birthdays from JSON
    logger.debug("Updating birthdays from JSON...");
    await syncPeopleFromJson();

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
        `${index + 1}. ${report.fullName} has been your friend for ${
          report.yearsInContact
        } years.`
    )
    .join("\n");

  return `${header}${body}${footer}`;
}

/**
 * Generates a report of people whose birthdays are today.
 * @param {PeopleAttributes[]} people - The list of people.
 * @returns {BirthdayReport[]} The birthday reports.
 */
function getBirthdayReport(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();

  return people
    .filter((person) => {
      const birthday = new Date(person.birthday);
      return (
        birthday.getDate() === today.getDate() &&
        birthday.getMonth() === today.getMonth()
      );
    })
    .map((person) => ({
      fullName: `${person.firstName} ${person.lastName}`,
      yearsInContact: today.getFullYear() - person.yearMet,
    }));
}

/**
 * Asynchronously synchronizes people data from a JSON file into the database.
 *
 * This function reads the 'Profiles.json' file from the local file system, iterates over each profile,
 * and either updates the existing record or inserts a new one into the 'People' table in the database.
 *
 * Logs a final message on completion or logs any errors encountered during the process.
 *
 * @async
 * @function
 * @returns {Promise<void>} Resolves once the sync operation is complete, or logs an error if something fails.
 */
export async function syncPeopleFromJson() {
  try {
    // Step 1: Read the JSON file
    const filePath = path.resolve(__dirname, "../data/Profiles.json");
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const profiles: Array<Profile> = JSON.parse(jsonData);

    const phoneNumbersInJson = profiles.map((profile) => profile.phoneNumber);
    console.log(phoneNumbersInJson);

    // Step 2: Iterate over the profiles
    for (const profile of profiles) {
      const {
        firstName,
        lastName,
        birthday,
        yearMet,
        phoneNumber,
        email,
        location,
      } = profile;

      // Step 3: Check if the person already exists in the database
      const existingPerson = await People.findOne({
        where: { phoneNumber },
      });

      if (existingPerson) {
        // Step 4: Update the existing record
        await existingPerson.update({
          firstName,
          lastName,
          birthday,
          yearMet,
          email,
          location,
        });
        logger.info(`Updated record for ${firstName} ${lastName}`);
      } else {
        // Step 5: Insert a new record
        await People.create({
          firstName,
          lastName,
          birthday,
          yearMet,
          phoneNumber,
          email,
          location,
        });
        logger.info(`Inserted new record for ${firstName} ${lastName}`);
      }
    }

    // Step 6: Delete records from the database that are not present in the JSON file
    const people = await People.findAll();
    const allPeople = people.map((person) => person.toJSON());

    if (allPeople) {
      for (const person of allPeople) {
        console.log(person);
        if (!phoneNumbersInJson.includes(person.phoneNumber)) {
          await People.destroy({
            where: {
              phoneNumber: person.phoneNumber,
            },
          });
          logger.info(
            `Deleted record for ${person.firstName} ${person.lastName}`
          );
        }
      }
    }

    logger.info("Sync completed successfully.");
  } catch (error) {
    logger.error("Error syncing profiles from JSON:", error);
  }
}

export default generateBirthdayReport;
export { getBirthdayReport };

import { format } from "date-fns";
import logger from "../config/logger";
import { People } from "../models/People";
import { PeopleAttributes } from "../types/models/PeopleInterface";
import { BirthdayReport } from "../types/services/BirthdayReminder";

/**
 * Generates birthday reports based on the specified type
 * @param type - "daily", "monthly", "upcoming", or "all"
 * @returns Promise<BirthdayReport[]> The birthday reports
 */
export async function getBirthdayReports(
  type: "daily" | "monthly" | "upcoming"
): Promise<BirthdayReport[]> {
  try {
    logger.info(`Generating ${type} birthday reports...`);

    const contacts = await fetchContacts();
    if (contacts.length === 0) {
      logger.info("No contacts found in the database.");
      return [];
    }

    switch (type) {
      case "daily":
        return getBirthdayReport(contacts);
      case "monthly":
        return getMonthlyBirthdays(contacts);
      case "upcoming":
        return getUpcomingBirthdays(contacts);
      default:
        throw new Error(`Invalid report type: ${type}`);
    }
  } catch (error) {
    logger.error(`Error generating ${type} birthday reports:`, error);
    throw error;
  }
}

/**
 * Generates a formatted birthday message for Slack
 * @param type - "daily", "monthly", "upcoming", or "all"
 * @returns Promise<string> The formatted Slack message
 */
export async function generateBirthdayMessage(
  type: "daily" | "monthly" | "upcoming"
): Promise<string> {
  try {
    const reports = await getBirthdayReports(type);
    return formatBirthdayMessageForSlack(reports, type);
  } catch (error) {
    logger.error(`Error generating ${type} birthday message:`, error);
    throw error;
  }
}

/**
 * Fetches all contacts from the database
 * @returns Promise<PeopleAttributes[]> The contacts
 */
async function fetchContacts(): Promise<PeopleAttributes[]> {
  logger.debug("Fetching contacts...");
  const contacts = (await People.findAll({ raw: true })) as PeopleAttributes[];
  logger.debug(`Fetched ${contacts.length} contacts.`);
  return contacts;
}

/**
 * Formats a birthday date for display
 * @param birthday - The birthday Date object
 * @returns The formatted birthday string (e.g., "February 26")
 */
function formatBirthdayDate(birthday: Date): string {
  try {
    const iso = birthday.toISOString();
    const datePart = iso.substring(0, 10);
    const [year, month, day] = datePart.split("-");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
  } catch (error) {
    logger.error("Error in formatBirthdayDate:", error);
    return "N/A";
  }
}

/**
 * Formats birthday reports into a Slack-friendly message
 * @param reports - The birthday reports
 * @param type - The type of report
 * @returns The formatted Slack message
 */
function formatBirthdayMessageForSlack(
  reports: BirthdayReport[],
  type: "daily" | "monthly" | "upcoming"
): string {
  const timestamp = format(new Date(), "PPpp");

  const config = getMessageConfig(type);
  let message = `${config.header}\n`;
  message += `*Report Generated:* ${timestamp}\n\n`;

  if (reports.length === 0) {
    message += config.emptyMessage;
  } else {
    message += `*${config.sectionTitle}:*\n`;

    const formattedReports = reports.map((report, index) => {
      const bdFormatted = report.birthday
        ? formatBirthdayDate(report.birthday)
        : "N/A";
      const yearsText =
        report.yearsInContact > 0
          ? ` – Friends for ${report.yearsInContact} years`
          : " – New connection this year";
      return `> ${index + 1}. *${
        report.name
      }*${yearsText} (Birthday: ${bdFormatted})`;
    });

    message += formattedReports.join("\n") + "\n\n";
    message += config.callToAction;
  }

  message += `\n\n_Generated at: ${timestamp}_`;

  logger.debug(`Formatted ${type} message generated`);
  return message;
}

/**
 * Gets message configuration based on report type
 * @param type - The report type
 * @returns The message configuration
 */
function getMessageConfig(type: "daily" | "monthly" | "upcoming") {
  const configs = {
    daily: {
      header: "*🎉 Daily Birthday Report 🎉*",
      sectionTitle: "Birthdays Today",
      emptyMessage: "*No birthdays today!* 🌟",
      callToAction: "*Don't forget to send your wishes!* 🎂",
    },
    monthly: {
      header: "*📅 Monthly Birthday Report 📅*",
      sectionTitle: "Birthdays This Month",
      emptyMessage: "*No birthdays this month!* 📆",
      callToAction: "*Mark your calendars!* 🗓️",
    },
    upcoming: {
      header: "*🔮 Next Upcoming Birthday 🔮*",
      sectionTitle: "Next Birthday",
      emptyMessage: "*No upcoming birthdays found!* 🤷‍♂️",
      callToAction: "*Get ready to celebrate!* 🎁",
    },
  };

  return configs[type];
}

/**
 * Generates a report of people whose birthdays are today
 * @param people - The list of people
 * @returns The birthday reports
 */
function getBirthdayReport(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const localMonth = (today.getMonth() + 1).toString().padStart(2, "0");
  const localDay = today.getDate().toString().padStart(2, "0");
  const todayLocal = `${localMonth}-${localDay}`;

  return filterAndMapBirthdays(people, (bdStr) => bdStr === todayLocal);
}

/**
 * Generates a report of people whose birthdays fall in the current month
 * @param people - The list of people
 * @returns The birthday reports ordered by date
 */
function getMonthlyBirthdays(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0");

  const reports = filterAndMapBirthdays(
    people,
    (bdStr) => bdStr.substring(0, 2) === currentMonth
  );

  // Sort by day of month
  return reports.sort((a, b) => {
    if (!a.birthday || !b.birthday) return 0;
    return a.birthday.getDate() - b.birthday.getDate();
  });
}

/**
 * Generates a report of people who share the next upcoming birthday
 * @param people - The list of people
 * @returns The birthday reports for the next birthday
 */
function getUpcomingBirthdays(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const todayNum = todayMonth * 100 + todayDay;

  let minCandidateNum = Infinity;

  for (const person of people) {
    if (!person.birthday) continue;

    const bd =
      person.birthday instanceof Date
        ? person.birthday
        : new Date(person.birthday);
    const bdStr = bd.toISOString().substring(5, 10);
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

  const normalized =
    minCandidateNum >= 1200 + 100 ? minCandidateNum - 1200 : minCandidateNum;
  const upcomingMonth = Math.floor(normalized / 100)
    .toString()
    .padStart(2, "0");
  const upcomingDay = (normalized % 100).toString().padStart(2, "0");
  const upcoming = `${upcomingMonth}-${upcomingDay}`;

  return filterAndMapBirthdays(people, (bdStr) => bdStr === upcoming);
}

/**
 * Helper function to filter and map birthdays based on a condition
 * @param people - The list of people
 * @param condition - Function to test if birthday matches criteria
 * @returns The filtered and mapped birthday reports
 */
function filterAndMapBirthdays(
  people: PeopleAttributes[],
  condition: (bdStr: string) => boolean
): BirthdayReport[] {
  const today = new Date();

  return people
    .filter((person) => {
      if (!person.birthday) {
        logger.debug(`Skipping ${person.name} (no birthday)`);
        return false;
      }

      const bd =
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday);
      const bdStr = bd.toISOString().substring(5, 10);

      return condition(bdStr);
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

// Legacy function for backward compatibility
export async function generateBirthdayReport(
  type: string = "daily"
): Promise<string> {
  const reportType = type === "daily" ? "daily" : "monthly";
  return generateBirthdayMessage(reportType as "daily" | "monthly");
}

// Export the core functions for testing
export { getBirthdayReport, getUpcomingBirthdays, getMonthlyBirthdays };
export default generateBirthdayReport;

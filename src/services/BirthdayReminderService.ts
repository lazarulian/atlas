import { format } from "date-fns";
import logger from "../config/logger";
import { People } from "../models/People";
import { PeopleAttributes } from "../types/models/PeopleInterface";
import { BirthdayReport } from "../types/services/BirthdayReminder";

/**
 * Generates the birthday report message to be sent via Slack.
 * @param type - "daily" for birthdays today, otherwise monthly.
 * @returns {Promise<string>} The formatted birthday message.
 */
export async function generateBirthdayReport(
  type: string = "daily"
): Promise<string> {
  try {
    logger.info("Generating Birthday Report...");

    // Fetch contacts from the database.
    logger.debug("Fetching contacts...");
    const contacts = (await People.findAll({
      raw: true,
    })) as PeopleAttributes[];
    logger.debug(`Fetched ${contacts.length} contacts.`);

    if (contacts.length === 0) {
      logger.info("No contacts found in the database.");
      return formatBirthdayMessage([], []);
    }

    const birthdayReports = getBirthdayReport(contacts);
    const monthlyBirthdays = getMonthlyBirthdays(contacts);
    const upcomingBirthdays = getUpcomingBirthdays(contacts);

    const reportsToUse = type === "daily" ? birthdayReports : monthlyBirthdays;
    const birthdayMessage = formatBirthdayMessage(
      reportsToUse,
      upcomingBirthdays
    );
    logger.debug("Formatted birthday message generated.");

    return birthdayMessage;
  } catch (error) {
    logger.error("Error in generating Birthday Report:", error);
    throw error;
  }
}

/**
 * Formats a birthday so that it displays the intended calendar date.
 * Instead of using Date arithmetic (which applies local time zone offsets),
 * this function extracts the "YYYY-MM-DD" portion from the stored ISO string
 * and then formats that string directly.
 *
 * @param birthday - The birthday Date.
 * @returns The formatted birthday string (e.g., "February 26").
 */
function formatBirthdayDate(birthday: Date): string {
  try {
    // Get the stored date string in YYYY-MM-DD format.
    const iso = birthday.toISOString(); // e.g., "2002-02-26T00:00:00.000Z"
    const datePart = iso.substring(0, 10); // "2002-02-26"
    // Split the date part.
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
    const formatted = `${monthNames[parseInt(month, 10) - 1]} ${parseInt(
      day,
      10
    )}`;
    return formatted;
  } catch (error) {
    logger.error("Error in formatBirthdayDate:", error);
    return "N/A";
  }
}

/**
 * Formats the birthday message to be sent.
 * @param reports - The report for birthdays (today or this month).
 * @param nextBirthdayReports - The report for the next upcoming birthday.
 * @returns The formatted birthday message.
 */
function formatBirthdayMessage(
  reports: BirthdayReport[],
  nextBirthdayReports: BirthdayReport[]
): string {
  const timestamp = format(new Date(), "PPpp");
  let message = `*🎉 Birthday Report 🎉*\n`;
  message += `*Report Generated:* ${timestamp}\n\n`;

  // Section: Birthdays (Today/This Month)
  if (reports.length > 0) {
    // Determine header label based on type.
    const headerLabel =
      reports.length === getBirthdayReport([]).length ? "Today" : "This Month";
    message += `*Birthdays ${headerLabel}:*\n`;
    const list = reports.map((report, index) => {
      const bdFormatted = report.birthday
        ? formatBirthdayDate(new Date(report.birthday))
        : "N/A";
      return `> ${index + 1}. *${report.name}* – Friends for ${
        report.yearsInContact
      } years (Birthday: ${bdFormatted})`;
    });
    message +=
      list.join("\n") + "\n\n*Don't forget to send your wishes!* 🎂\n\n";
  } else {
    message += `*No birthdays found.*\n\n`;
  }

  // Section: Upcoming Birthday(s)
  if (nextBirthdayReports.length > 0) {
    const nextBdFormatted = nextBirthdayReports[0].birthday
      ? formatBirthdayDate(new Date(nextBirthdayReports[0].birthday))
      : "N/A";
    message += `*Upcoming Birthday: ${nextBdFormatted}*\n`;
    const upcomingList = nextBirthdayReports.map(
      (report) => `> *${report.name}*`
    );
    message += upcomingList.join("\n") + "\n\n*Get ready to celebrate!* 🎁\n\n";
  }

  message += `_Collected at: ${timestamp}_\n`;
  logger.debug(`Final formatted message: ${message}`);
  return message;
}

/**
 * Generates a report of people whose birthdays are today.
 * Compares the stored birthday’s MM-DD (from its ISO string) with today's local MM-DD.
 * @param people - The list of people.
 * @returns The birthday reports.
 */
function getBirthdayReport(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  // Build today's local MM-DD string (using local date, as the report is for "today").
  const localMonth = (today.getMonth() + 1).toString().padStart(2, "0");
  const localDay = today.getDate().toString().padStart(2, "0");
  const todayLocal = `${localMonth}-${localDay}`; // e.g., "02-25"

  const reports = people
    .filter((person) => {
      if (!person.birthday) {
        logger.debug(
          `getBirthdayReport: Skipping ${person.name} (no birthday)`
        );
        return false;
      }
      const bd =
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday);
      // Use the stored ISO date's MM-DD (which is correct as stored) for comparison.
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
  return reports;
}

/**
 * Generates a report of people whose birthdays fall in the current month.
 * Compares the stored birthday’s MM portion (from its ISO string) with today's local month.
 * @param people - The list of people.
 * @returns The birthday reports.
 */
function getMonthlyBirthdays(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0"); // e.g., "02"
  logger.debug(`getMonthlyBirthdays: Current local month: ${currentMonth}`);

  const reports = people
    .filter((person) => {
      if (!person.birthday) {
        return false;
      }
      const bd =
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday);
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
  return reports;
}

/**
 * Generates a report of people who share the next upcoming birthday.
 * Calculates a numeric candidate for each birthday based solely on the stored MM-DD.
 * If the candidate is less than today's local MMDD, it’s treated as next year.
 * @param people - The list of people.
 * @returns The birthday reports for the next birthday.
 */
function getUpcomingBirthdays(people: PeopleAttributes[]): BirthdayReport[] {
  const today = new Date();
  const todayMonth = today.getMonth() + 1; // local month (1–12)
  const todayDay = today.getDate(); // local day (1–31)
  const todayNum = todayMonth * 100 + todayDay; // e.g., Feb 25 -> 225
  logger.debug(`getUpcomingBirthdays: Today's numeric value: ${todayNum}`);

  let minCandidateNum = Infinity;
  for (const person of people) {
    if (!person.birthday) {
      continue;
    }
    const bd =
      person.birthday instanceof Date
        ? person.birthday
        : new Date(person.birthday);
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

  // Normalize candidate number back to an "MM-DD" string.
  const normalized =
    minCandidateNum >= 1200 + 100 ? minCandidateNum - 1200 : minCandidateNum;
  const upcomingMonth = Math.floor(normalized / 100)
    .toString()
    .padStart(2, "0");
  const upcomingDay = (normalized % 100).toString().padStart(2, "0");
  const upcoming = `${upcomingMonth}-${upcomingDay}`;

  const reports = people
    .filter((person) => {
      if (!person.birthday) {
        return false;
      }
      const bd =
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday);
      const bdStr = bd.toISOString().substring(5, 10);
      return bdStr === upcoming;
    })
    .map((person) => ({
      name: person.name,
      yearsInContact: today.getFullYear() - person.yearMet,
      birthday:
        person.birthday instanceof Date
          ? person.birthday
          : new Date(person.birthday),
    }));
  return reports;
}

export default generateBirthdayReport;
export { getBirthdayReport, getUpcomingBirthdays, getMonthlyBirthdays };

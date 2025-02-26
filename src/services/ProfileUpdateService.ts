import logger from "../config/logger";
import NotionService from "./NotionService";
import { People } from "../models/People";
import { Profile } from "../types/models/PeopleInterface";
import {
  QueryDatabaseParameters,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

class ProfileUpdateService {
  private notionService: NotionService;

  constructor(notionService?: NotionService) {
    this.notionService = notionService || NotionService.getInstance();
  }

  /**
   * Fetches profiles from a Notion database, converts them to PeopleAttributes,
   * and upserts them into the People table.
   * @param databaseId - The Notion database ID.
   * @param filter - Optional Notion filter.
   * @param sorts - Optional Notion sorts.
   */
  public async syncProfilesFromNotion(
    filter?: QueryDatabaseParameters["filter"],
    sorts?: QueryDatabaseParameters["sorts"]
  ): Promise<void> {
    const databaseId = "e6577a09d27c4a1b9c2889a365fb0392";
    try {
      const response = await this.notionService.queryDatabase(
        databaseId,
        filter,
        sorts
      );

      if (!response || !response.results) {
        logger.warn("No results returned from Notion database.");
        return;
      }

      const pages: PageObjectResponse[] = response.results;

      for (const page of pages) {
        const attributes = this.mapNotionPageToPeopleAttributes(page);
        // If we can't map the page (missing required fields), skip it
        if (!attributes) {
          logger.warn(`Skipping page ${page.id} due to incomplete data`);
          continue;
        }

        await this.upsertPerson(attributes);
      }

      logger.info("Successfully synced profiles from Notion to the database.");
    } catch (error: any) {
      logger.error("Failed to sync profiles from Notion:", error.message);
      throw error;
    }
  }

  /**
   * Converts a Notion page into a PeopleAttributes object.
   * Adjust the mapping based on your field definitions.
   */
  public mapNotionPageToPeopleAttributes(
    page: PageObjectResponse
  ): Profile | null {
    const props: Record<string, any> = page.properties;
    const namePropery = props["Name"];
    const name = namePropery.title[0].plain_text.trim();

    const active = props["Active?"]?.checkbox ?? true;

    const birthdayStr = props["Birthday"]?.date?.start;
    const birthday = new Date(birthdayStr);

    const yearMet = props["YearMet"]?.number;
    if (typeof yearMet !== "number") {
      return null;
    }

    const phoneNumber = props["Phone"]?.phone_number;
    if (!phoneNumber) {
      return null;
    }

    const email = props["Email"]?.email || undefined;

    const locationMultiSelect = props["Location"]?.multi_select || [];
    const location = locationMultiSelect.map((item: any) => item.name);

    const affiliationMultiSelect = props["Affiliation"]?.multi_select || [];
    const affiliation = [
      ...affiliationMultiSelect.map((item: any) => item.name),
    ];

    const lastContactedStr = props["LastContacted"]?.date?.start;
    const lastContacted = lastContactedStr
      ? new Date(lastContactedStr)
      : new Date();

    const contactFrequency = props["Contact Frequency"]?.formula?.number ?? 30;

    // Chat Reminder (From "Chat?" formula)
    // This field is a number, could be negative.
    // Decide on logic. If negative means no need to chat, set chatReminder=0.
    let chatReminder = props["Chat?"]?.formula?.number ?? 1;
    if (chatReminder < 0) {
      chatReminder = 0;
    }

    const attributes: Profile = {
      // For ID, we do not have a numeric ID from Notion.
      // The DB is expected to auto-increment or we rely on unique phoneNumber for upsert.
      // We'll omit `id` here since upsert doesn't strictly need it if phoneNumber is unique.
      // If needed, you could handle `id` generation or read from DB after upsert.
      name,
      active,
      birthday,
      yearMet,
      phoneNumber,
      email,
      location,
      affiliation,
      lastContacted,
      contactFrequency,
      chatReminder,
    };

    return attributes;
  }

  /**
   * Upserts a person into the database using their phoneNumber as a unique key.
   */
  public async upsertPerson(attributes: Profile): Promise<void> {
    try {
      await People.upsert(attributes, {
        returning: false,
      });
    } catch (error: any) {
      logger.error(
        `Failed to upsert person with phoneNumber ${attributes.phoneNumber}:`,
        error.message
      );
      throw error;
    }
  }
}

export default ProfileUpdateService;

require("dotenv").config();

(async () => {
  const profileUpdateService = new ProfileUpdateService();

  try {
    await profileUpdateService.syncProfilesFromNotion();
  } catch (error) {
    console.error("Error querying Notion database:", error);
  }
})();

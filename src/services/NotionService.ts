import { Client } from "@notionhq/client";
import {
  QueryDatabaseParameters,
  CreatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import logger from "../config/logger";

class NotionService {
  private static instance: NotionService;
  private notionClient: Client;

  private constructor(notionToken: string) {
    if (!notionToken) {
      throw new Error("NOTION_API_KEY is not set in environment variables.");
    }

    this.notionClient = new Client({ auth: notionToken });
  }

  /**
   * Initializes or retrieves the single instance of NotionService.
   * @returns The singleton instance of NotionService.
   */
  public static getInstance(): NotionService {
    if (!NotionService.instance) {
      const notionToken = process.env.NOTION_API_KEY;
      if (!notionToken) {
        logger.error("NOTION_API_KEY is not set in environment variables.");
      } else {
        NotionService.instance = new NotionService(notionToken);
      }
    }
    return NotionService.instance;
  }

  /**
   * Queries a Notion database using filters, sorts, and pagination options.
   * @param databaseId - The ID of the Notion database to query.
   * @param filter - Optional filter object as defined by Notion API.
   * @param sorts - Optional sorting configuration.
   * @param startCursor - Optional start cursor for pagination.
   * @param pageSize - Optional page size limit.
   * @returns A promise that resolves to the Notion query response.
   */
  public async queryDatabase(
    databaseId: string,
    filter?: QueryDatabaseParameters["filter"],
    sorts?: QueryDatabaseParameters["sorts"],
    startCursor?: string,
    pageSize?: number
  ): Promise<any> {
    try {
      const response = await this.notionClient.databases.query({
        database_id: databaseId,
        filter: filter,
        sorts: sorts,
        start_cursor: startCursor,
        page_size: pageSize,
      });
      return response;
    } catch (error: any) {
      logger.error(`Failed to query database ${databaseId}:`, error.message);
      throw error;
    }
  }

  /**
   * Retrieves the metadata and properties of a Notion database.
   * @param databaseId - The ID of the Notion database to retrieve.
   * @returns A promise that resolves to the Notion database object.
   */
  public async getDatabaseProperties(databaseId: string): Promise<any> {
    try {
      const response = await this.notionClient.databases.retrieve({
        database_id: databaseId,
      });
      return response;
    } catch (error: any) {
      logger.error(`Failed to retrieve database ${databaseId}:`, error.message);
      throw error;
    }
  }

  /**
   * Retrieves a single page from Notion.
   * @param pageId - The ID of the page to retrieve.
   * @returns A promise that resolves to the Notion page object.
   */
  public async getPage(pageId: string): Promise<any> {
    try {
      const response = await this.notionClient.pages.retrieve({
        page_id: pageId,
      });
      return response;
    } catch (error: any) {
      logger.error(`Failed to retrieve page ${pageId}:`, error.message);
      throw error;
    }
  }

  /**
   * Example: Creates or updates a page within a Notion database.
   * @param parentDatabaseId - The database ID where the page belongs.
   * @param properties - The properties of the page to create or update.
   * @param pageId - Optional page ID if updating an existing page.
   * @returns A promise that resolves to the Notion page response.
   */
  public async upsertPage(
    parentDatabaseId: string,
    properties: CreatePageParameters["properties"],
    pageId?: string
  ): Promise<any> {
    try {
      let response;
      if (pageId) {
        response = await this.notionClient.pages.update({
          page_id: pageId,
          properties,
        });
      } else {
        response = await this.notionClient.pages.create({
          parent: { database_id: parentDatabaseId },
          properties,
        });
      }
      return response;
    } catch (error: any) {
      logger.error(
        `Failed to ${pageId ? "update" : "create"} page:`,
        error.message
      );
      throw error;
    }
  }
}

export default NotionService;

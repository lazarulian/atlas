import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";
import logger from "./logger";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Atlas API",
      version: "1.0.0",
      description: `
        Atlas is a comprehensive contact and birthday management system with Slack integration.
        
        ## Features
        - Birthday tracking and notifications
        - Slack integration for automated reports
        - Contact management and synchronization
        - Scheduled jobs for daily and monthly updates
        
        ## Authentication
        Currently, the API operates without authentication for internal use.
        
        ## Rate Limiting
        - Development: 1000 requests per 15 minutes per IP
        - Production: 100 requests per 15 minutes per IP
        
        ## Response Format
        All responses follow a consistent format:
        \`\`\`json
        {
          "success": true,
          "message": "Success message",
          "data": {...},
          "meta": {
            "timestamp": "2024-01-01T00:00:00.000Z",
            "requestId": "abc123"
          }
        }
        \`\`\`
      `,
      contact: {
        name: "Atlas API Support",
        email: "support@atlas.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:4000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
            data: {
              type: "object",
              description: "Response data varies by endpoint",
            },
            meta: {
              type: "object",
              properties: {
                timestamp: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-01T00:00:00.000Z",
                },
                requestId: {
                  type: "string",
                  example: "abc123def",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Error description",
                },
                statusCode: {
                  type: "integer",
                  example: 400,
                },
                stack: {
                  type: "string",
                  description: "Only included in development mode",
                },
              },
            },
            meta: {
              type: "object",
              properties: {
                requestId: {
                  type: "string",
                  example: "abc123def",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-01T00:00:00.000Z",
                },
                path: {
                  type: "string",
                  example: "/api/v1/resource",
                },
                method: {
                  type: "string",
                  example: "GET",
                },
              },
            },
          },
        },
        BirthdayReport: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the person",
              example: "John Doe",
            },
            yearsInContact: {
              type: "integer",
              description: "Number of years known",
              example: 3,
            },
            birthday: {
              type: "string",
              format: "date-time",
              description: "Birthday date",
              example: "1990-06-15T00:00:00.000Z",
            },
          },
          required: ["name", "yearsInContact", "birthday"],
        },
        SlackMessageRequest: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["daily", "monthly", "upcoming"],
              description: "Type of birthday report to send",
              example: "daily",
            },
            channel: {
              type: "string",
              description: "Slack channel name (with or without #)",
              example: "#daily-updates",
            },
          },
          required: ["type", "channel"],
        },
        HealthCheck: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["healthy", "degraded"],
              example: "healthy",
            },
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    example: "birthday",
                  },
                  name: {
                    type: "string",
                    example: "BirthdaySlackService",
                  },
                  status: {
                    type: "string",
                    enum: ["available", "unavailable"],
                    example: "available",
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        TooManyRequests: {
          description: "Rate limit exceeded",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Health",
        description: "System health and status endpoints",
      },
      {
        name: "Birthdays",
        description: "Birthday management and reporting",
      },
      {
        name: "Updates",
        description: "Scheduled update operations",
      },
      {
        name: "Slack",
        description: "Slack integration and messaging",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/routes/**/*.ts"],
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger documentation
 */
export const setupSwagger = (app: Application): void => {
  try {
    // Swagger UI options
    const swaggerUiOptions = {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Atlas API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
      },
    };

    // Serve swagger docs
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(specs, swaggerUiOptions)
    );

    // Serve swagger JSON
    app.get("/api-docs.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(specs);
    });

    logger.info("Swagger documentation available at /api-docs");
  } catch (error) {
    logger.error("Failed to setup Swagger documentation:", error);
  }
};

export { specs };
export default setupSwagger;

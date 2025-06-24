import { Router, Request, Response } from 'express';
import { successResponse, asyncHandler } from '../../middleware';
import { SlackMessageServiceFactory } from '../../services/slack/SlackMessageServiceFactory';
import { getBirthdayReports } from '../../services/BirthdayReminderService';
import logger from '../../config/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/birthdays/slack:
 *   post:
 *     summary: Send birthday message to Slack
 *     description: Send birthday reports to a specified Slack channel
 *     tags: [Birthdays, Slack]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [daily, monthly, upcoming]
 *                 example: daily
 *               channel:
 *                 type: string
 *                 example: "#daily-updates"
 *             required: [type, channel]
 *     responses:
 *       200:
 *         description: Birthday message sent successfully
 */
router.post('/slack', asyncHandler(async (req: Request, res: Response) => {
  const { type, channel } = req.body;

  try {
    const factory = SlackMessageServiceFactory.getInstance();
    const birthdayService = factory.getBirthdayService();

    // Ensure channel has # prefix for consistency
    const formattedChannel = channel.startsWith('#') ? channel : `#${channel}`;

    logger.info('Sending birthday Slack message', {
      requestId: req.requestId,
      type,
      channel: formattedChannel
    });

    // Send the appropriate message type
    switch (type) {
      case 'daily':
        await birthdayService.sendDailyReport(formattedChannel);
        break;
      case 'monthly':
        await birthdayService.sendMonthlyReport(formattedChannel);
        break;
      case 'upcoming':
        await birthdayService.sendUpcomingReport(formattedChannel);
        break;
      default:
        throw new Error(`Unsupported message type: ${type}`);
    }

    logger.info('Birthday Slack message sent successfully', {
      requestId: req.requestId,
      type,
      channel: formattedChannel
    });

    successResponse(res, {
      type,
      channel: formattedChannel,
      sentAt: new Date().toISOString()
    }, `${type.charAt(0).toUpperCase() + type.slice(1)} birthday message sent successfully`);

  } catch (error) {
    logger.error('Failed to send birthday Slack message', {
      requestId: req.requestId,
      type,
      channel,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}));

/**
 * @swagger
 * /api/v1/birthdays/data:
 *   get:
 *     summary: Get birthday reports data
 *     description: Returns birthday report data as JSON
 *     tags: [Birthdays]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, monthly, upcoming]
 *           default: daily
 *         description: Type of birthday report
 *     responses:
 *       200:
 *         description: Birthday reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "daily"
 *                         reports:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/BirthdayReport'
 *                         count:
 *                           type: integer
 *                           example: 3
 */
router.get('/data', asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'daily';

  try {
    logger.info('Birthday data requested', {
      requestId: req.requestId,
      type
    });

    const reports = await getBirthdayReports(type as "daily" | "monthly" | "upcoming");

    logger.info('Birthday data retrieved successfully', {
      requestId: req.requestId,
      type,
      count: reports.length
    });

    successResponse(res, {
      type,
      reports,
      count: reports.length,
      generatedAt: new Date().toISOString()
    }, `${type.charAt(0).toUpperCase() + type.slice(1)} birthday reports retrieved successfully`);

  } catch (error) {
    logger.error('Failed to get birthday data', {
      requestId: req.requestId,
      type,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}));

/**
 * @swagger
 * /api/v1/birthdays/info:
 *   get:
 *     summary: Get birthday service information
 *     description: Returns information about the birthday service and its capabilities
 *     tags: [Birthdays]
 *     responses:
 *       200:
 *         description: Birthday service information retrieved successfully
 */
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  try {
    const factory = SlackMessageServiceFactory.getInstance();
    const birthdayService = factory.getBirthdayService();

    const serviceInfo = {
      serviceName: birthdayService.getServiceName(),
      availableMessageTypes: birthdayService.getAvailableMessageTypes(),
      description: 'Birthday management and Slack notification service',
      endpoints: {
        sendMessage: 'POST /api/v1/birthdays/slack',
        getData: 'GET /api/v1/birthdays/data',
        serviceInfo: 'GET /api/v1/birthdays/info'
      }
    };

    logger.info('Birthday service info requested', {
      requestId: req.requestId
    });

    successResponse(res, serviceInfo, 'Birthday service information retrieved successfully');

  } catch (error) {
    logger.error('Failed to get birthday service info', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}));

export default router;

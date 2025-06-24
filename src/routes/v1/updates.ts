import { Router, Request, Response } from 'express';
import { successResponse, asyncHandler } from '../../middleware';
import logger from '../../config/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/updates/daily:
 *   post:
 *     summary: Run daily update job
 *     description: Execute the daily update job manually
 *     tags: [Updates]
 *     responses:
 *       200:
 *         description: Daily update job completed successfully
 *       202:
 *         description: Daily update job started
 */
router.post('/daily', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Manual daily update job triggered', {
      requestId: req.requestId,
      triggeredBy: 'manual'
    });

    // Import here to avoid circular dependencies
    const executeDailyUpdates = (await import('../../jobs/DailyUpdates')).default;
    
    // Run the daily updates job
    await executeDailyUpdates();

    logger.info('Daily update job completed successfully', {
      requestId: req.requestId
    });

    successResponse(res, {
      jobType: 'daily',
      status: 'completed',
      triggeredBy: 'manual',
      completedAt: new Date().toISOString()
    }, 'Daily update job completed successfully');

  } catch (error) {
    logger.error('Daily update job failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}));

/**
 * @swagger
 * /api/v1/updates/monthly:
 *   post:
 *     summary: Run monthly update job
 *     description: Execute the monthly update job manually
 *     tags: [Updates]
 *     responses:
 *       200:
 *         description: Monthly update job completed successfully
 *       202:
 *         description: Monthly update job started
 */
router.post('/monthly', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Manual monthly update job triggered', {
      requestId: req.requestId,
      triggeredBy: 'manual'
    });

    // Import here to avoid circular dependencies
    const executeMonthlyUpdates = (await import('../../jobs/MonthlyUpdates')).default;
    
    // Run the monthly updates job
    await executeMonthlyUpdates();

    logger.info('Monthly update job completed successfully', {
      requestId: req.requestId
    });

    successResponse(res, {
      jobType: 'monthly',
      status: 'completed',
      triggeredBy: 'manual',
      completedAt: new Date().toISOString()
    }, 'Monthly update job completed successfully');

  } catch (error) {
    logger.error('Monthly update job failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}));

/**
 * @swagger
 * /api/v1/updates/status:
 *   get:
 *     summary: Get update jobs status
 *     description: Returns information about available update jobs
 *     tags: [Updates]
 *     responses:
 *       200:
 *         description: Update jobs status retrieved successfully
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    const status = {
      availableJobs: [
        {
          name: 'daily',
          description: 'Daily birthday updates and notifications',
          endpoint: 'POST /api/v1/updates/daily',
          lastRun: null // Could be tracked in database/memory if needed
        },
        {
          name: 'monthly',
          description: 'Monthly birthday reports and summaries',
          endpoint: 'POST /api/v1/updates/monthly',
          lastRun: null // Could be tracked in database/memory if needed
        }
      ],
      systemInfo: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      }
    };

    logger.info('Update jobs status requested', {
      requestId: req.requestId
    });

    successResponse(res, status, 'Update jobs status retrieved successfully');

  } catch (error) {
    logger.error('Failed to get update jobs status', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}));

export default router; 
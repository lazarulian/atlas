import { Router, Request, Response } from 'express';
import { successResponse, asyncHandler } from '../../middleware';
import { SlackMessageServiceFactory } from '../../services/slack/SlackMessageServiceFactory';
import logger from '../../config/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic health status of the service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         uptime:
 *                           type: number
 *                           description: "Process uptime in seconds"
 *                         memory:
 *                           type: object
 *                           description: "Memory usage statistics"
 *                         version:
 *                           type: string
 *                           example: "1.0.0"
 *                         environment:
 *                           type: string
 *                           example: "development"
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  logger.info('Health check requested', { requestId: req.requestId });
  successResponse(res, healthData, 'Service is healthy');
}));

/**
 * @swagger
 * /api/v1/health/status:
 *   get:
 *     summary: Detailed system status
 *     description: Returns detailed system status including service health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *       206:
 *         description: System status retrieved with errors
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    const factory = SlackMessageServiceFactory.getInstance();
    const factoryHealth = factory.healthCheck();
    
    const systemData = {
      status: factoryHealth.status,
      services: factoryHealth.services,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timezone: process.env.TZ || 'UTC'
      },
      timestamp: new Date().toISOString()
    };

    logger.info('System status requested', { 
      requestId: req.requestId,
      status: factoryHealth.status,
      serviceCount: factoryHealth.services.length
    });

    successResponse(res, systemData, 'System status retrieved successfully');
  } catch (error) {
    logger.error('Failed to get system status', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorData = {
      status: 'degraded',
      services: [],
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    successResponse(res, errorData, 'System status retrieved with errors', 206);
  }
}));

/**
 * @swagger
 * /api/v1/health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes/Docker readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service not ready
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    const factory = SlackMessageServiceFactory.getInstance();
    const health = factory.healthCheck();
    
    if (health.status === 'healthy') {
      successResponse(res, { ready: true }, 'Service is ready');
    } else {
      successResponse(res, { ready: false, reason: 'Services degraded' }, 'Service not ready', 503);
    }
  } catch (error) {
    logger.error('Readiness check failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    successResponse(res, { ready: false, reason: 'Health check failed' }, 'Service not ready', 503);
  }
}));

/**
 * @swagger
 * /api/v1/health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes/Docker liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  successResponse(res, { alive: true }, 'Service is alive');
}));

export default router; 
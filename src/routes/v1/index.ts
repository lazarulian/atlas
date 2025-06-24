import { Router } from 'express';
import healthRoutes from './health';
import birthdayRoutes from './birthdays';
import updatesRoutes from './updates';

const router = Router();

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API v1 information
 *     description: Returns information about the Atlas API v1
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
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
 *                         name:
 *                           type: string
 *                           example: "Atlas API"
 *                         version:
 *                           type: string
 *                           example: "v1"
 *                         description:
 *                           type: string
 *                           example: "Contact and birthday management system with Slack integration"
 *                         endpoints:
 *                           type: object
 *                           properties:
 *                             health:
 *                               type: string
 *                               example: "/api/v1/health"
 *                             birthdays:
 *                               type: string
 *                               example: "/api/v1/birthdays"
 *                             updates:
 *                               type: string
 *                               example: "/api/v1/updates"
 *                             people:
 *                               type: string
 *                               example: "/api/v1/people"
 *                         documentation:
 *                           type: string
 *                           example: "/api-docs"
 */
router.get('/', (req, res) => {
  const apiInfo = {
    name: 'Atlas API',
    version: 'v1',
    description: 'Contact and birthday management system with Slack integration',
    endpoints: {
      health: '/api/v1/health',
      birthdays: '/api/v1/birthdays',
      updates: '/api/v1/updates',
    },
    documentation: '/api-docs',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Atlas API v1 information',
    data: apiInfo,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID')
    }
  });
});

// Mount route modules
router.use('/health', healthRoutes);
router.use('/birthdays', birthdayRoutes);
router.use('/updates', updatesRoutes);

export default router; 
import { Router } from 'express';
import v1Routes from './v1';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Returns basic API information and available versions
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API root information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Atlas API is running"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Atlas API"
 *                     description:
 *                       type: string
 *                       example: "Contact and birthday management system with Slack integration"
 *                     versions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["v1"]
 *                     documentation:
 *                       type: string
 *                       example: "/api-docs"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     requestId:
 *                       type: string
 */
router.get('/', (req, res) => {
  const apiInfo = {
    name: 'Atlas API',
    description: 'Contact and birthday management system with Slack integration',
    versions: ['v1'],
    documentation: '/api-docs',
    status: 'active',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    scheduler: 'active'
  };

  res.json({
    success: true,
    message: 'Atlas API is running',
    data: apiInfo,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID')
    }
  });
});

// Mount API versions
router.use('/api/v1', v1Routes);

// Legacy route redirects with deprecation warnings
router.get('/updates/*', (req, res) => {
  res.status(301).json({
    success: false,
    error: {
      message: 'This endpoint has been moved to /api/v1/updates. Please update your requests.',
      statusCode: 301,
      deprecated: true,
      newEndpoint: `/api/v1/updates${req.path.replace('/updates', '')}`
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID'),
      path: req.path,
      method: req.method
    }
  });
});

router.get('/birthdays/*', (req, res) => {
  res.status(301).json({
    success: false,
    error: {
      message: 'This endpoint has been moved to /api/v1/birthdays. Please update your requests.',
      statusCode: 301,
      deprecated: true,
      newEndpoint: `/api/v1/birthdays${req.path.replace('/birthdays', '')}`
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID'),
      path: req.path,
      method: req.method
    }
  });
});

export default router;

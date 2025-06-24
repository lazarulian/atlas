import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { setupSecurity, setupMiddleware, errorHandler, notFoundHandler, successResponse, asyncHandler, AppError } from '../../middleware';

describe('Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
  });

  describe('setupSecurity', () => {
    it('should setup security middleware without errors', () => {
      expect(() => setupSecurity(app)).not.toThrow();
    });

    it('should add security headers', async () => {
      setupSecurity(app);
      setupMiddleware(app);
      
      app.get('/test', (req, res) => {
        res.json({ test: true });
      });

      const response = await request(app).get('/test');
      
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('setupMiddleware', () => {
    it('should setup general middleware without errors', () => {
      expect(() => setupMiddleware(app)).not.toThrow();
    });

    it('should add request ID to requests', async () => {
      setupMiddleware(app);
      
      app.get('/test', (req, res) => {
        res.json({ requestId: req.requestId });
      });

      const response = await request(app).get('/test');
      
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    it('should parse JSON bodies', async () => {
      setupMiddleware(app);
      
      app.post('/test', (req, res) => {
        res.json(req.body);
      });

      const testData = { test: 'data' };
      const response = await request(app)
        .post('/test')
        .send(testData);
      
      expect(response.body).toEqual(testData);
    });
  });

  describe('successResponse', () => {
    it('should format success responses correctly', async () => {
      setupMiddleware(app);
      
      app.get('/test', (req, res) => {
        successResponse(res, { test: 'data' }, 'Test success');
      });

      const response = await request(app).get('/test');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test success');
      expect(response.body.data).toEqual({ test: 'data' });
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
    });

    it('should handle custom status codes', async () => {
      setupMiddleware(app);
      
      app.get('/test', (req, res) => {
        successResponse(res, { created: true }, 'Created', 201);
      });

      const response = await request(app).get('/test');
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Created');
    });
  });

  describe('asyncHandler', () => {
    it('should handle async functions without errors', async () => {
      setupMiddleware(app);
      
             app.get('/test', asyncHandler(async (req: Request, res: Response) => {
         await new Promise(resolve => setTimeout(resolve, 10));
         successResponse(res, { async: true }, 'Async success');
       }));

      const response = await request(app).get('/test');
      
      expect(response.status).toBe(200);
      expect(response.body.data.async).toBe(true);
    });

    it('should catch async errors', async () => {
      setupMiddleware(app);
      
             app.get('/test', asyncHandler(async (req: Request, res: Response) => {
         throw new Error('Async error');
       }));
      
      app.use(errorHandler);

      const response = await request(app).get('/test');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Async error');
    });
  });

  describe('errorHandler', () => {
    it('should handle custom AppError with status code', async () => {
      setupMiddleware(app);
      
      app.get('/test', (req, res, next) => {
        const error = new Error('Custom error') as AppError;
        error.statusCode = 400;
        next(error);
      });
      
      app.use(errorHandler);

      const response = await request(app).get('/test');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Custom error');
      expect(response.body.error.statusCode).toBe(400);
      expect(response.body.meta.requestId).toBeDefined();
    });

    it('should handle generic errors with 500 status', async () => {
      setupMiddleware(app);
      
      app.get('/test', (req, res, next) => {
        next(new Error('Generic error'));
      });
      
      app.use(errorHandler);

      const response = await request(app).get('/test');
      
      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Generic error');
      expect(response.body.error.statusCode).toBe(500);
    });
  });

  describe('notFoundHandler', () => {
    it('should handle 404 errors correctly', async () => {
      setupMiddleware(app);
      app.use(notFoundHandler);

      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Route GET /nonexistent not found');
      expect(response.body.error.statusCode).toBe(404);
      expect(response.body.meta.requestId).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should work with full middleware stack', async () => {
      setupSecurity(app);
      setupMiddleware(app);
      
             app.get('/success', asyncHandler(async (req: Request, res: Response) => {
         successResponse(res, { integration: true }, 'Integration test');
       }));
       
       app.get('/error', asyncHandler(async (req: Request, res: Response) => {
         const error = new Error('Integration error') as AppError;
         error.statusCode = 422;
         throw error;
       }));
      
      app.use(notFoundHandler);
      app.use(errorHandler);

                    // Test success case
       const successRes = await request(app).get('/success');
       expect(successRes.status).toBe(200);
       expect(successRes.body.success).toBe(true);
       expect(successRes.headers['x-request-id']).toBeDefined();

       // Test error case
       const errorRes = await request(app).get('/error');
       expect(errorRes.status).toBe(422);
       expect(errorRes.body.success).toBe(false);
       expect(errorRes.body.error.statusCode).toBe(422);

       // Test 404 case
       const notFoundRes = await request(app).get('/nonexistent');
       expect(notFoundRes.status).toBe(404);
       expect(notFoundRes.body.success).toBe(false);
    });
  });
}); 
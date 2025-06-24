import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from '../config/logger';

/**
 * Interface for custom error with status code
 */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Security middleware configuration
 */
export const setupSecurity = (app: Application): void => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
    message: {
      error: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);
};

/**
 * General middleware setup
 */
export const setupMiddleware = (app: Application): void => {
  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        }
      }
    }));
  }

  // Request ID and timing middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.startTime = Date.now();
    req.requestId = Math.random().toString(36).substr(2, 9);
    
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Powered-By', 'Atlas API');
    
    logger.debug(`Request ${req.requestId}: ${req.method} ${req.path}`, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  });
};

/**
 * Global error handler
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const requestId = req.requestId;
  const duration = Date.now() - (req.startTime || Date.now());

  // Log error
  logger.error(`Request ${requestId} failed`, {
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    message,
    duration,
    stack: err.stack,
    ip: req.ip,
  });

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.requestId;
  const duration = Date.now() - (req.startTime || Date.now());

  logger.warn(`Request ${requestId} - Route not found`, {
    requestId,
    method: req.method,
    path: req.path,
    duration,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  });
};

/**
 * Success response handler
 */
export const successResponse = (
  res: Response,
  data: any,
  message = 'Success',
  statusCode = 200
): void => {
  const response = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID'),
    },
  };

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
} 
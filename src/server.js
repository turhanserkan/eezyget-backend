  console.log('=== SERVER STARTING ===');
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform);

  try {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const dotenv = require('dotenv');
  const path = require('path');
  const fs = require('fs');

  console.log('=== LOADING MODULES ===');

  const logger = require('./utils/logger');
  const downloadRoutes = require('./routes/download');
  const spotifyRoutes = require('./routes/spotify');
  const youtubeRoutes = require('./routes/youtube');
  const { errorHandler } = require('./middleware/errorHandler');
  const { requestLogger } = require('./middleware/requestLogger');

  console.log('=== MODULES LOADED ===');

  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Trust proxy for Railway deployment
  app.set('trust proxy', true);

  // Create required directories
  const requiredDirs = ['downloads', 'temp', 'logs'];
  requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
      }
  });

  // Security middleware
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 *
  60 * 1000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
  });

  app.use(limiter);

  // CORS configuration
  const corsOptions = {
      origin: [
          'https://eezyget.com',
          'https://www.eezyget.com',
          'http://localhost:3000',
          'http://127.0.0.1:3000'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
      res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || '1.0.0'
      });
  });

  // API routes
  app.use('/api/spotify', spotifyRoutes);
  app.use('/api/youtube', youtubeRoutes);
  app.use('/api/download', downloadRoutes);

  // Serve static files (downloads)
  app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

  // Root endpoint
  app.get('/', (req, res) => {
      res.json({
          message: 'eezyGet Backend API',
          version: '1.0.0',
          endpoints: {
              health: '/health',
              spotify: '/api/spotify',
              youtube: '/api/youtube',
              download: '/api/download'
          }
      });
  });

  // 404 handler
  app.use('*', (req, res) => {
      res.status(404).json({
          error: 'Endpoint not found',
          message: `Cannot ${req.method} ${req.originalUrl}`,
          availableEndpoints: [
              'GET /health',
              'GET /api/spotify/track/:id',
              'GET /api/spotify/playlist/:id',
              'POST /api/download/track',
              'POST /api/download/playlist'
          ]
      });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Graceful shutdown
  process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
      });
  });

  process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
          logger.info('Process terminated');
          process.exit(0);
      });
  });

  console.log('=== STARTING SERVER ===');

  // Start server
  const server = app.listen(PORT, () => {
      console.log(`=== SERVER STARTED ON PORT ${PORT} ===`);
      logger.info(`eezyGet Backend API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
  });

  module.exports = app;

  } catch (error) {
      console.error('=== STARTUP ERROR ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
  }

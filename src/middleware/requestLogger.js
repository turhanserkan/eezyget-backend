  const logger = require('../utils/logger');

  // Request logging middleware
  const requestLogger = (req, res, next) => {
      const startTime = Date.now();

      // Log request
      logger.info(`${req.method} ${req.url}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          contentType: req.get('Content-Type'),
          contentLength: req.get('Content-Length'),
          referer: req.get('Referer'),
          timestamp: new Date().toISOString()
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
          const duration = Date.now() - startTime;

          // Log response
          logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
              duration: `${duration}ms`,
              statusCode: res.statusCode,
              contentLength: res.get('Content-Length'),
              ip: req.ip,
              timestamp: new Date().toISOString()
          });

          // Call original end method
          originalEnd.call(this, chunk, encoding);
      };

      next();
  };

  module.exports = { requestLogger };

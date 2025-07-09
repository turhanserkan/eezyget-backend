const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');

const logger = require('./utils/logger');
const downloadRoutes = require('./routes/download');
const spotifyRoutes = require('./routes/spotify');
const youtubeRoutes = require('./routes/youtube');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const cacheService = require('./services/cacheService');

dotenv.config();

const app = express();
const server = createServer(app);
// CORS origins configuration
const corsOrigins = process.env.CORS_ORIGINS || 'https://eezyget.com';
const allowedOrigins = [...new Set(corsOrigins.split(',').map(origin => origin.trim()).filter(Boolean))];
console.log('CORS Origins configured:', allowedOrigins);
console.log('Original CORS_ORIGINS env:', process.env.CORS_ORIGINS);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

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
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const corsOptions = {
    origin: allowedOrigins,
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
    const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    };
    
    // Add cache stats in development
    if (process.env.NODE_ENV !== 'production') {
        healthData.cache = cacheService.getStats();
    }
    
    res.json(healthData);
});

// Cache management endpoints (development only)
if (process.env.NODE_ENV !== 'production') {
    app.get('/cache/stats', (req, res) => {
        res.json({
            success: true,
            data: cacheService.getStats()
        });
    });
    
    app.post('/cache/clear', (req, res) => {
        const { type } = req.body;
        if (type) {
            cacheService.clear(type);
        } else {
            cacheService.clearAll();
        }
        res.json({
            success: true,
            message: `Cache ${type || 'all'} cleared`
        });
    });
}

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
    io.close(() => {
        server.close(() => {
            logger.info('Process terminated');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    io.close(() => {
        server.close(() => {
            logger.info('Process terminated');
            process.exit(0);
        });
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    
    socket.on('join-download', (jobId) => {
        socket.join(`download-${jobId}`);
        logger.info(`Socket ${socket.id} joined download-${jobId}`);
    });
    
    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

// Make io available globally for download service
global.io = io;

// Start server
server.listen(PORT, () => {
    logger.info(`eezyGet Backend API running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Socket.IO enabled for real-time updates`);
});

module.exports = app;
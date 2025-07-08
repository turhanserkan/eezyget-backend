const logger = require('../utils/logger');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Default error response
    let response = {
        success: false,
        error: 'Internal Server Error',
        message: 'Something went wrong'
    };

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        response.error = 'Resource not found';
        response.message = 'Invalid ID format';
        return res.status(404).json(response);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        response.error = 'Duplicate field value';
        response.message = 'Resource already exists';
        return res.status(400).json(response);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        response.error = 'Validation Error';
        response.message = 'Invalid input data';
        response.details = errors;
        return res.status(400).json(response);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        response.error = 'Invalid token';
        response.message = 'Not authorized';
        return res.status(401).json(response);
    }

    if (err.name === 'TokenExpiredError') {
        response.error = 'Token expired';
        response.message = 'Not authorized';
        return res.status(401).json(response);
    }

    // Spotify API errors
    if (err.message.includes('Spotify')) {
        response.error = 'Spotify API Error';
        response.message = err.message;
        return res.status(400).json(response);
    }

    // YouTube API errors
    if (err.message.includes('YouTube')) {
        response.error = 'YouTube API Error';
        response.message = err.message;
        return res.status(400).json(response);
    }

    // File system errors
    if (err.code === 'ENOENT') {
        response.error = 'File not found';
        response.message = 'Requested file does not exist';
        return res.status(404).json(response);
    }

    if (err.code === 'EACCES') {
        response.error = 'Permission denied';
        response.message = 'Cannot access file';
        return res.status(403).json(response);
    }

    // Rate limiting errors
    if (err.message.includes('rate limit')) {
        response.error = 'Rate limit exceeded';
        response.message = 'Too many requests, please try again later';
        return res.status(429).json(response);
    }

    // Custom application errors
    if (err.statusCode) {
        response.error = err.name || 'Application Error';
        response.message = err.message;
        return res.status(err.statusCode).json(response);
    }

    // Default to 500 server error
    const statusCode = err.statusCode || 500;
    
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.details = err;
    }

    res.status(statusCode).json(response);
};

// 404 handler
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Create custom error
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

module.exports = {
    errorHandler,
    notFound,
    createError
};
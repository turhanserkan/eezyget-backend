const Joi = require('joi');

// URL validation schema (supports both Spotify and YouTube)
const urlSchema = Joi.object({
    url: Joi.string()
        .uri()
        .pattern(/^https:\/\/(open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+(\?.*)?|(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+)$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid Spotify or YouTube URL format',
            'string.uri': 'URL must be a valid URI',
            'any.required': 'URL is required'
        }),
    format: Joi.string()
        .valid('mp3', 'wav', 'flac', 'mp4', 'webm', 'avi')
        .default('mp3')
        .messages({
            'any.only': 'Format must be one of: mp3, wav, flac, mp4, webm, avi'
        }),
    quality: Joi.string()
        .valid('64', '128', '192', '256', '320', '144', '240', '360', '480', '720', '1080')
        .default('320')
        .messages({
            'any.only': 'Quality must be one of: 64, 128, 192, 256, 320 (audio) or 144, 240, 360, 480, 720, 1080 (video)'
        })
});

// Spotify URL validation schema (for backward compatibility)
const spotifyUrlSchema = Joi.object({
    url: Joi.string()
        .uri()
        .pattern(/^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+(\?.*)?$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid Spotify URL format',
            'string.uri': 'URL must be a valid URI',
            'any.required': 'Spotify URL is required'
        }),
    format: Joi.string()
        .valid('mp3', 'wav', 'flac', 'mp4', 'webm', 'avi')
        .default('mp3')
        .messages({
            'any.only': 'Format must be one of: mp3, wav, flac, mp4, webm, avi'
        }),
    quality: Joi.string()
        .valid('64', '128', '192', '256', '320', '144', '240', '360', '480', '720', '1080')
        .default('320')
        .messages({
            'any.only': 'Quality must be one of: 64, 128, 192, 256, 320 (audio) or 144, 240, 360, 480, 720, 1080 (video)'
        })
});

// Download validation schema
const downloadSchema = Joi.object({
    url: Joi.string()
        .uri()
        .pattern(/^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+(\?.*)?$/)
        .required(),
    format: Joi.string()
        .valid('mp3', 'wav', 'flac')
        .default('mp3'),
    quality: Joi.string()
        .valid('128', '192', '256', '320')
        .default('320')
});

// Search validation schema
const searchSchema = Joi.object({
    q: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.min': 'Search query must be at least 1 character',
            'string.max': 'Search query cannot exceed 100 characters',
            'any.required': 'Search query is required'
        }),
    type: Joi.string()
        .valid('track', 'album', 'playlist', 'artist')
        .default('track'),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(20)
        .messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 50'
        })
});

// Generic validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};

// Query validation middleware
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Query validation failed',
                details: errors
            });
        }

        // Replace req.query with validated and sanitized data
        req.query = value;
        next();
    };
};

// Specific validation middlewares
const validateSpotifyUrl = validate(spotifyUrlSchema);
const validateDownload = validate(downloadSchema);
const validateSearch = validateQuery(searchSchema);

// Custom validation functions
const isValidSpotifyUrl = (url) => {
    const regex = /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+(\?.*)?$/;
    return regex.test(url);
};

const isValidYouTubeUrl = (url) => {
    const regex = /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    return regex.test(url);
};

const isValidUrl = (url) => {
    return isValidSpotifyUrl(url) || isValidYouTubeUrl(url);
};

const getUrlType = (url) => {
    if (isValidSpotifyUrl(url)) return 'spotify';
    if (isValidYouTubeUrl(url)) return 'youtube';
    return null;
};

const parseSpotifyId = (url) => {
    const match = url.match(/https:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    return match ? { type: match[1], id: match[2] } : null;
};

const sanitizeFilename = (filename) => {
    // Remove or replace invalid characters
    return filename
        .replace(/[<>:"\/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const validateFileFormat = (format) => {
    const validFormats = ['mp3', 'wav', 'flac'];
    return validFormats.includes(format.toLowerCase());
};

const validateAudioQuality = (quality) => {
    const validQualities = ['64', '128', '192', '256', '320'];
    return validQualities.includes(quality);
};

// Validation middlewares
const validateUrl = validate(urlSchema);

module.exports = {
    validate,
    validateQuery,
    validateSpotifyUrl,
    validateUrl,
    validateDownload,
    validateSearch,
    isValidSpotifyUrl,
    isValidYouTubeUrl,
    isValidUrl,
    getUrlType,
    parseSpotifyId,
    sanitizeFilename,
    validateFileFormat,
    validateAudioQuality,
    schemas: {
        urlSchema,
        spotifyUrlSchema,
        downloadSchema,
        searchSchema
    }
};
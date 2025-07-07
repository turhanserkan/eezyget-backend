  const express = require('express');
  const router = express.Router();
  const youtubeService = require('../services/youtubeService');
  const { validateUrl } = require('../middleware/validation');
  const { asyncHandler } = require('../middleware/asyncHandler');

  // Download YouTube video as audio
  router.post('/download', asyncHandler(async (req, res) => {
      const { url, format = 'mp3', quality = '320' } = req.body;

      const result = await youtubeService.downloadVideo(url, format, quality);

      // Update download URL to use the main download endpoint
      result.downloadUrl = `/api/download/file/${result.jobId}`;

      res.json({
          success: true,
          data: result
      });
  }));

  // Get YouTube video information
  router.post('/info', asyncHandler(async (req, res) => {
      const { url } = req.body;

      const info = await youtubeService.getVideoInfo(url);

      res.json({
          success: true,
          data: info
      });
  }));

  // Search YouTube videos
  router.get('/search', asyncHandler(async (req, res) => {
      const { q, limit = 10 } = req.query;

      if (!q) {
          return res.status(400).json({
              success: false,
              error: 'Query parameter "q" is required'
          });
      }

      const results = await youtubeService.searchVideos(q, limit);

      res.json({
          success: true,
          data: results
      });
  }));

  module.exports = router;

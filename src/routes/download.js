  const express = require('express');
  const router = express.Router();
  const path = require('path');
  const fs = require('fs');
  const youtubeService = require('../services/youtubeService');
  const { asyncHandler } = require('../middleware/asyncHandler');

  // Download file by job ID
  router.get('/file/:jobId', asyncHandler(async (req, res) => {
      const { jobId } = req.params;

      try {
          const filePath = await youtubeService.getDownloadFile(jobId);

          if (!fs.existsSync(filePath)) {
              return res.status(404).json({
                  success: false,
                  error: 'File not found'
              });
          }

          const filename = path.basename(filePath);
          const fileSize = fs.statSync(filePath).size;

          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.setHeader('Content-Length', fileSize);
          res.setHeader('Content-Type', 'application/octet-stream');

          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);

      } catch (error) {
          res.status(404).json({
              success: false,
              error: error.message
          });
      }
  }));

  // Get download status
  router.get('/status/:jobId', asyncHandler(async (req, res) => {
      const { jobId } = req.params;

      try {
          const status = await youtubeService.getDownloadStatus(jobId);

          res.json({
              success: true,
              data: status
          });
      } catch (error) {
          res.status(404).json({
              success: false,
              error: error.message
          });
      }
  }));

  // Get download history
  router.get('/history', asyncHandler(async (req, res) => {
      const { limit = 50, offset = 0 } = req.query;

      const history = await youtubeService.getDownloadHistory(
          parseInt(limit),
          parseInt(offset)
      );

      res.json({
          success: true,
          data: history
      });
  }));

  // Basic track download (for compatibility)
  router.post('/track', validateSpotifyUrl, asyncHandler(async (req, res) => {
      const { url, format = 'mp3', quality = '320' } = req.body;

      console.log('=== DOWNLOAD TRACK DEBUG ===');
      console.log('URL:', url);
      console.log('Format:', format);
      console.log('Quality:', quality);

      try {
          const result = await downloadService.downloadTrack(url, format, quality);

          console.log('Download successful:', result);

          res.json({
              success: true,
              data: result
          });
      } catch (error) {
          console.log('=== DOWNLOAD ERROR DETAILS ===');
          console.log('Error message:', error.message);
          console.log('Error stack:', error.stack);
          console.log('=============================');
          throw error;
      }
  }));

  module.exports = router;

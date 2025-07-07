  const express = require('express');
  const router = express.Router();
  const { asyncHandler } = require('../middleware/asyncHandler');

  // Parse Spotify URL to get track info
  router.post('/parse', asyncHandler(async (req, res) => {
      const { url } = req.body;

      // Basic Spotify URL parsing
      const match =
  url.match(/https:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);

      if (!match) {
          return res.status(400).json({
              success: false,
              error: 'Invalid Spotify URL'
          });
      }

      const [, type, id] = match;

      // Mock response for now (in real implementation, you'd use Spotify Web API)
      const mockData = {
          id: id,
          type: type,
          name: 'Sample Track',
          artists: [{ name: 'Sample Artist' }],
          album: {
              name: 'Sample Album',
              images: [{ url: 'https://via.placeholder.com/300x300' }]
          },
          duration_ms: 180000,
          preview_url: null
      };

      res.json({
          success: true,
          data: mockData
      });
  }));

  // Get track info by ID
  router.get('/track/:id', asyncHandler(async (req, res) => {
      const { id } = req.params;

      // Mock response for now
      const mockData = {
          id: id,
          name: 'Sample Track',
          artists: [{ name: 'Sample Artist' }],
          album: {
              name: 'Sample Album',
              images: [{ url: 'https://via.placeholder.com/300x300' }]
          },
          duration_ms: 180000,
          preview_url: null
      };

      res.json({
          success: true,
          data: mockData
      });
  }));

  // Get playlist info by ID
  router.get('/playlist/:id', asyncHandler(async (req, res) => {
      const { id } = req.params;

      // Mock response for now
      const mockData = {
          id: id,
          name: 'Sample Playlist',
          description: 'A sample playlist',
          owner: { display_name: 'Sample User' },
          tracks: {
              total: 50,
              items: []
          },
          images: [{ url: 'https://via.placeholder.com/300x300' }]
      };

      res.json({
          success: true,
          data: mockData
      });
  }));

  // Search Spotify (mock for now)
  router.get('/search', asyncHandler(async (req, res) => {
      const { q, type = 'track', limit = 20 } = req.query;

      if (!q) {
          return res.status(400).json({
              success: false,
              error: 'Query parameter "q" is required'
          });
      }

      // Mock search results
      const mockResults = {
          tracks: {
              items: [
                  {
                      id: 'sample1',
                      name: `Search result for: ${q}`,
                      artists: [{ name: 'Sample Artist' }],
                      album: {
                          name: 'Sample Album',
                          images: [{ url: 'https://via.placeholder.com/300x300' }]
                      },
                      duration_ms: 180000
                  }
              ]
          }
      };

      res.json({
          success: true,
          data: mockResults
      });
  }));

  module.exports = router;

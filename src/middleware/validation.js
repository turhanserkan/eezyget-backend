  // URL validation middleware
  const validateUrl = (req, res, next) => {
      const { url } = req.body;

      if (!url) {
          return res.status(400).json({
              success: false,
              error: 'URL is required'
          });
      }

      // Basic URL validation
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
          return res.status(400).json({
              success: false,
              error: 'Invalid URL format'
          });
      }

      next();
  };

  // Spotify URL validation
  const validateSpotifyUrl = (req, res, next) => {
      const { url } = req.body;

      const spotifyPattern =
  /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+/;
      if (!spotifyPattern.test(url)) {
          return res.status(400).json({
              success: false,
              error: 'Invalid Spotify URL'
          });
      }

      next();
  };

  // YouTube URL validation
  const validateYouTubeUrl = (req, res, next) => {
      const { url } = req.body;

      const youtubePattern =
  /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
      if (!youtubePattern.test(url)) {
          return res.status(400).json({
              success: false,
              error: 'Invalid YouTube URL'
          });
      }

      next();
  };

  module.exports = {
      validateUrl,
      validateSpotifyUrl,
      validateYouTubeUrl
  };

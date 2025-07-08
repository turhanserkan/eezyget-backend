const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');
const { validateSpotifyUrl } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/asyncHandler');

// Get track information
router.get('/track/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const track = await spotifyService.getTrack(id);
    
    res.json({
        success: true,
        data: track
    });
}));

// Get playlist information
router.get('/playlist/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const playlist = await spotifyService.getPlaylist(id);
    
    res.json({
        success: true,
        data: playlist
    });
}));

// Get album information
router.get('/album/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const album = await spotifyService.getAlbum(id);
    
    res.json({
        success: true,
        data: album
    });
}));

// Parse Spotify URL and get information
router.post('/parse', asyncHandler(async (req, res) => {
    const { url } = req.body;
    
    console.log('=== SPOTIFY PARSE DEBUG ===');
    console.log('URL:', url);
    console.log('CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID);
    console.log('CLIENT_SECRET exists:', !!process.env.SPOTIFY_CLIENT_SECRET);
    
    const parsedData = await spotifyService.parseSpotifyUrlAndGetData(url);
    
    console.log('Parsed data:', JSON.stringify(parsedData, null, 2));
    
    res.json({
        success: true,
        data: parsedData
    });
}));

// Search tracks
router.get('/search', asyncHandler(async (req, res) => {
    const { q, type = 'track', limit = 20 } = req.query;
    
    if (!q) {
        return res.status(400).json({
            success: false,
            error: 'Query parameter "q" is required'
        });
    }
    
    const results = await spotifyService.search(q, type, limit);
    
    res.json({
        success: true,
        data: results
    });
}));

module.exports = router;
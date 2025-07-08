const express = require('express');
const router = express.Router();
const downloadService = require('../services/downloadService');
const youtubeService = require('../services/youtubeService');
const { validateSpotifyUrl } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/asyncHandler');

// Download single track
router.post('/track', validateSpotifyUrl, asyncHandler(async (req, res) => {
    const { url, format = 'mp3', quality = '320' } = req.body;
    
    const result = await downloadService.downloadTrack(url, format, quality);
    
    res.json({
        success: true,
        data: result
    });
}));

// Download playlist
router.post('/playlist', validateSpotifyUrl, asyncHandler(async (req, res) => {
    const { url, format = 'mp3', quality = '320' } = req.body;
    
    const result = await downloadService.downloadPlaylist(url, format, quality);
    
    res.json({
        success: true,
        data: result
    });
}));

// Download album
router.post('/album', validateSpotifyUrl, asyncHandler(async (req, res) => {
    const { url, format = 'mp3', quality = '320' } = req.body;
    
    const result = await downloadService.downloadAlbum(url, format, quality);
    
    res.json({
        success: true,
        data: result
    });
}));

// Get download status
router.get('/status/:jobId', asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    
    const status = await downloadService.getDownloadStatus(jobId);
    
    res.json({
        success: true,
        data: status
    });
}));

// Download file
router.get('/file/:fileId', asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    
    let filePath;
    try {
        // Try downloadService first (for Spotify downloads)
        filePath = await downloadService.getDownloadFile(fileId);
    } catch (error) {
        try {
            // Try youtubeService if not found in downloadService
            filePath = await youtubeService.getDownloadFile(fileId);
        } catch (error2) {
            return res.status(404).json({
                success: false,
                error: 'File not found or expired'
            });
        }
    }
    
    res.download(filePath, (err) => {
        if (err) {
            res.status(404).json({
                success: false,
                error: 'File not found or expired'
            });
        }
    });
}));

// Get download history
router.get('/history', asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    
    const history = await downloadService.getDownloadHistory(limit, offset);
    
    res.json({
        success: true,
        data: history
    });
}));

module.exports = router;
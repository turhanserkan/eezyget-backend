const ytdl = require('@distube/ytdl-core');
const ytsr = require('ytsr');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sanitize = require('sanitize-filename');
const archiver = require('archiver');
const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');
const logger = require('../utils/logger');
const spotifyService = require('./spotifyService');

class DownloadService {
    constructor() {
        this.downloadPath = path.join(__dirname, '../../downloads');
        this.tempPath = path.join(__dirname, '../../temp');
        this.activeDownloads = new Map();
        this.downloadHistory = [];
        
        // Ensure directories exist
        [this.downloadPath, this.tempPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async searchYouTube(query, maxResults = 5) {
        try {
            const searchResults = await ytsr(query, { limit: maxResults });
            
            return searchResults.items
                .filter(item => item.type === 'video')
                .map(item => ({
                    id: item.id,
                    title: item.title,
                    duration: item.duration,
                    url: item.url,
                    thumbnail: item.bestThumbnail?.url,
                    views: item.views,
                    uploadDate: item.uploadedAt
                }));
        } catch (error) {
            logger.error('YouTube search failed:', error.message);
            throw new Error('Failed to search YouTube');
        }
    }

    async findBestMatch(spotifyTrack) {
        const artists = spotifyTrack.artists.map(a => a.name).join(' ');
        const searchQuery = `${artists} ${spotifyTrack.name}`;
        
        logger.info(`Searching YouTube for: ${searchQuery}`);
        
        const searchResults = await this.searchYouTube(searchQuery, 10);
        
        if (searchResults.length === 0) {
            throw new Error('No matching videos found on YouTube');
        }

        // Simple scoring algorithm - prefer exact matches and shorter videos
        const scoredResults = searchResults.map(result => {
            let score = 0;
            const title = result.title.toLowerCase();
            const trackName = spotifyTrack.name.toLowerCase();
            const artistNames = artists.toLowerCase();
            
            // Title contains track name
            if (title.includes(trackName)) score += 3;
            
            // Title contains artist name
            if (title.includes(artistNames)) score += 2;
            
            // Prefer videos with reasonable duration (not too long, not too short)
            const duration = this.parseDuration(result.duration);
            const spotifyDuration = spotifyTrack.duration_ms / 1000;
            const durationDiff = Math.abs(duration - spotifyDuration);
            
            if (durationDiff < 30) score += 2; // Within 30 seconds
            else if (durationDiff < 60) score += 1; // Within 1 minute
            
            // Penalize very long videos (likely not music)
            if (duration > 600) score -= 2; // 10 minutes
            
            return { ...result, score };
        });
        
        scoredResults.sort((a, b) => b.score - a.score);
        
        logger.info(`Best match found: ${scoredResults[0].title} (score: ${scoredResults[0].score})`);
        return scoredResults[0];
    }

    parseDuration(duration) {
        if (!duration) return 0;
        
        const parts = duration.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        return 0;
    }

    async downloadFromYouTube(videoUrl, outputPath, format = 'mp3', quality = '320') {
        return new Promise((resolve, reject) => {
            try {
                const stream = ytdl(videoUrl, {
                    quality: 'highestaudio',
                    filter: 'audioonly',
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    }
                });

                if (format === 'mp3') {
                    const ffmpegCommand = ffmpeg(stream)
                        .audioBitrate(quality)
                        .format('mp3')
                        .audioCodec('libmp3lame')
                        .audioChannels(2)
                        .audioFrequency(44100);
                    
                    ffmpegCommand
                        .save(outputPath)
                        .on('progress', (progress) => {
                            logger.debug(`Download progress: ${progress.percent}%`);
                        })
                        .on('end', () => {
                            logger.info(`Download completed: ${outputPath} (${quality}kbps)`);
                            resolve(outputPath);
                        })
                        .on('error', (err) => {
                            logger.error(`Download failed: ${err.message}`);
                            reject(err);
                        });
                } else {
                    const writeStream = fs.createWriteStream(outputPath);
                    stream.pipe(writeStream);
                    
                    writeStream.on('finish', () => {
                        logger.info(`Download completed: ${outputPath}`);
                        resolve(outputPath);
                    });
                    
                    writeStream.on('error', (err) => {
                        logger.error(`Download failed: ${err.message}`);
                        reject(err);
                    });
                }
            } catch (error) {
                logger.error(`Download initialization failed: ${error.message}`);
                reject(error);
            }
        });
    }

    async addMetadata(filePath, metadata) {
        try {
            const tags = {
                title: metadata.title,
                artist: metadata.artist,
                album: metadata.album,
                year: metadata.year,
                genre: metadata.genre,
                trackNumber: metadata.trackNumber,
                partOfSet: metadata.discNumber,
                comment: 'Downloaded from Spotify via eezyGet'
            };

            // Download and add album art if available
            if (metadata.image) {
                try {
                    const axios = require('axios');
                    const response = await axios.get(metadata.image, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data);
                    tags.image = {
                        mime: 'image/jpeg',
                        type: {
                            id: 3,
                            name: 'Front Cover'
                        },
                        description: 'Album Cover',
                        imageBuffer: buffer
                    };
                } catch (error) {
                    logger.warn(`Failed to download album art: ${error.message}`);
                }
            }

            NodeID3.write(tags, filePath);
            logger.info(`Metadata added to: ${filePath}`);
        } catch (error) {
            logger.error(`Failed to add metadata: ${error.message}`);
        }
    }

    async downloadTrack(spotifyUrl, format = 'mp3', quality = '320') {
        const jobId = uuidv4();
        
        try {
            // Update status
            this.activeDownloads.set(jobId, {
                status: 'processing',
                progress: 0,
                message: 'Getting track information...'
            });

            // Parse Spotify URL and get track data
            const parsed = await spotifyService.parseSpotifyUrlAndGetData(spotifyUrl);
            const track = parsed.data;

            // Update status
            this.activeDownloads.set(jobId, {
                status: 'processing',
                progress: 25,
                message: 'Searching for audio source...'
            });

            // Find best YouTube match
            const youtubeVideo = await this.findBestMatch(track);

            // Create filename
            const artists = track.artists.map(a => a.name).join(', ');
            const filename = sanitize(`${artists} - ${track.name}.${format}`);
            const outputPath = path.join(this.downloadPath, filename);

            // Update status
            this.activeDownloads.set(jobId, {
                status: 'downloading',
                progress: 50,
                message: 'Downloading audio...'
            });

            // Download from YouTube
            await this.downloadFromYouTube(youtubeVideo.url, outputPath, format, quality);

            // Update status
            this.activeDownloads.set(jobId, {
                status: 'processing',
                progress: 75,
                message: 'Adding metadata...'
            });

            // Add metadata
            await this.addMetadata(outputPath, {
                title: track.name,
                artist: artists,
                album: track.album.name,
                year: track.album.release_date ? new Date(track.album.release_date).getFullYear() : null,
                image: track.album.images[0]?.url
            });

            // Update status
            this.activeDownloads.set(jobId, {
                status: 'completed',
                progress: 100,
                message: 'Download completed',
                filename: filename,
                filePath: outputPath,
                fileSize: fs.statSync(outputPath).size
            });

            // Add to history
            this.downloadHistory.unshift({
                jobId,
                type: 'track',
                title: track.name,
                artist: artists,
                album: track.album.name,
                filename,
                fileSize: fs.statSync(outputPath).size,
                format,
                quality,
                downloadedAt: new Date().toISOString()
            });

            return {
                jobId,
                filename,
                fileSize: fs.statSync(outputPath).size,
                downloadUrl: `/api/download/file/${jobId}`
            };

        } catch (error) {
            logger.error(`Download failed for job ${jobId}:`, error.message);
            
            this.activeDownloads.set(jobId, {
                status: 'failed',
                progress: 0,
                message: error.message
            });

            throw error;
        }
    }

    async downloadPlaylist(spotifyUrl, format = 'mp3', quality = '320') {
        const jobId = uuidv4();
        
        try {
            // Get playlist data
            const parsed = await spotifyService.parseSpotifyUrlAndGetData(spotifyUrl);
            const playlist = parsed.data;

            this.activeDownloads.set(jobId, {
                status: 'processing',
                progress: 0,
                message: `Processing playlist: ${playlist.name}`,
                totalTracks: playlist.tracks.total,
                completedTracks: 0
            });

            const tempDir = path.join(this.tempPath, jobId);
            fs.mkdirSync(tempDir, { recursive: true });

            const downloadedFiles = [];
            
            for (let i = 0; i < playlist.tracks.items.length; i++) {
                const track = playlist.tracks.items[i];
                
                try {
                    // Update progress
                    this.activeDownloads.set(jobId, {
                        ...this.activeDownloads.get(jobId),
                        progress: Math.round((i / playlist.tracks.items.length) * 80),
                        message: `Downloading: ${track.name}`,
                        completedTracks: i
                    });

                    // Find and download track
                    const youtubeVideo = await this.findBestMatch(track);
                    const artists = track.artists.map(a => a.name).join(', ');
                    const filename = sanitize(`${String(i + 1).padStart(2, '0')} - ${artists} - ${track.name}.${format}`);
                    const outputPath = path.join(tempDir, filename);

                    await this.downloadFromYouTube(youtubeVideo.url, outputPath, format, quality);
                    
                    // Add metadata
                    await this.addMetadata(outputPath, {
                        title: track.name,
                        artist: artists,
                        album: track.album.name,
                        year: track.album.release_date ? new Date(track.album.release_date).getFullYear() : null,
                        trackNumber: i + 1,
                        image: track.album.images[0]?.url
                    });

                    downloadedFiles.push({
                        filename,
                        path: outputPath,
                        size: fs.statSync(outputPath).size
                    });

                } catch (error) {
                    logger.error(`Failed to download track ${track.name}:`, error.message);
                    continue;
                }
            }

            // Create ZIP file
            this.activeDownloads.set(jobId, {
                ...this.activeDownloads.get(jobId),
                progress: 90,
                message: 'Creating archive...'
            });

            const zipFilename = sanitize(`${playlist.name}.zip`);
            const zipPath = path.join(this.downloadPath, zipFilename);
            
            await this.createZipArchive(tempDir, zipPath);

            // Clean up temp directory
            fs.rmSync(tempDir, { recursive: true, force: true });

            this.activeDownloads.set(jobId, {
                status: 'completed',
                progress: 100,
                message: 'Playlist download completed',
                filename: zipFilename,
                filePath: zipPath,
                fileSize: fs.statSync(zipPath).size,
                totalTracks: playlist.tracks.total,
                completedTracks: downloadedFiles.length
            });

            return {
                jobId,
                filename: zipFilename,
                fileSize: fs.statSync(zipPath).size,
                totalTracks: playlist.tracks.total,
                completedTracks: downloadedFiles.length,
                downloadUrl: `/api/download/file/${jobId}`
            };

        } catch (error) {
            logger.error(`Playlist download failed for job ${jobId}:`, error.message);
            
            this.activeDownloads.set(jobId, {
                status: 'failed',
                progress: 0,
                message: error.message
            });

            throw error;
        }
    }

    async downloadAlbum(spotifyUrl, format = 'mp3', quality = '320') {
        const jobId = uuidv4();
        
        try {
            const parsed = await spotifyService.parseSpotifyUrlAndGetData(spotifyUrl);
            const album = parsed.data;

            // Similar to playlist download but for albums
            // Implementation would be similar to downloadPlaylist
            
            return await this.downloadPlaylist(spotifyUrl, format, quality);

        } catch (error) {
            logger.error(`Album download failed for job ${jobId}:`, error.message);
            throw error;
        }
    }

    async createZipArchive(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => {
                logger.info(`ZIP archive created: ${outputPath} (${archive.pointer()} bytes)`);
                resolve(outputPath);
            });

            archive.on('error', (err) => {
                logger.error(`ZIP creation failed: ${err.message}`);
                reject(err);
            });

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    async getDownloadStatus(jobId) {
        const status = this.activeDownloads.get(jobId);
        if (!status) {
            throw new Error('Download job not found');
        }
        return status;
    }

    async getDownloadFile(jobId) {
        const status = this.activeDownloads.get(jobId);
        if (!status || status.status !== 'completed') {
            throw new Error('Download not completed or job not found');
        }
        return status.filePath;
    }

    async getDownloadHistory(limit = 50, offset = 0) {
        return this.downloadHistory
            .slice(offset, offset + limit)
            .map(item => ({
                ...item,
                filePath: undefined // Don't expose file paths
            }));
    }
}

module.exports = new DownloadService();
const ytdl = require('@distube/ytdl-core');
const ytsr = require('ytsr');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sanitize = require('sanitize-filename');
const archiver = require('archiver');
const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');
const logger = require('../utils/logger');
const spotifyService = require('./spotifyService');
const cacheService = require('./cacheService');

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

    // Emit progress updates via Socket.IO
    emitProgress(jobId, data) {
        if (global.io) {
            global.io.to(`download-${jobId}`).emit('download-progress', {
                jobId,
                ...data
            });
        }
    }

    async searchYouTube(query, maxResults = 5) {
        try {
            console.log('=== YOUTUBE SEARCH DEBUG ===');
            console.log('Query:', query);
            console.log('Max results:', maxResults);
            
            // Validate input
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Invalid search query provided');
            }
            
            // Check cache first
            const cacheKey = `${query}_${maxResults}`;
            const cachedResults = cacheService.getCachedSearch(cacheKey);
            if (cachedResults) {
                console.log('Cache hit for YouTube search:', query);
                logger.debug(`YouTube search cache hit: ${query}`);
                return cachedResults;
            }
            
            // Try yt-dlp search first (more reliable)
            try {
                console.log('Trying yt-dlp search...');
                const searchUrl = `ytsearch${maxResults}:${query}`;
                const searchResults = await youtubedl(searchUrl, {
                    dumpSingleJson: true,
                    flatPlaylist: true,
                    extractFlat: true,
                    format: 'best[ext=mp4]',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                });
                
                const videos = searchResults.entries ? searchResults.entries.map(item => ({
                    id: item.id,
                    title: item.title,
                    duration: item.duration || '0:00',
                    url: `https://www.youtube.com/watch?v=${item.id}`,
                    thumbnail: item.thumbnail,
                    views: item.view_count || 0,
                    uploadDate: item.upload_date
                })) : [];
                
                console.log('yt-dlp search results:', videos.length);
                if (videos.length > 0) {
                    // Cache the results
                    cacheService.setCachedSearch(cacheKey, videos);
                    logger.debug(`YouTube search cached via yt-dlp: ${query}`);
                    return videos;
                }
            } catch (ytdlpError) {
                console.log('yt-dlp search failed, trying ytsr...', ytdlpError.message);
            }
            
            // Fallback to ytsr
            console.log('Trying ytsr search...');
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const searchResults = await ytsr(query, { 
                limit: maxResults,
                gl: 'US',
                hl: 'en',
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                }
            });
            
            console.log('ytsr search results found:', searchResults.items.length);
            console.log('Video items:', searchResults.items.filter(item => item.type === 'video').length);
            
            const videos = searchResults.items
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
            
            console.log('Filtered videos:', videos.length);
            if (videos.length > 0) {
                console.log('First video:', videos[0]);
            }
            
            if (videos.length === 0) {
                logger.warn(`No videos found for query: ${query}`);
                throw new Error('No matching videos found for this search');
            }
            
            // Cache the results
            cacheService.setCachedSearch(cacheKey, videos);
            logger.debug(`YouTube search cached via ytsr: ${query}`);
            
            return videos;
        } catch (error) {
            console.error('YouTube search error details:', error);
            logger.error('YouTube search failed:', {
                error: error.message,
                query: query,
                stack: error.stack
            });
            
            // Re-throw with more user-friendly message
            if (error.message.includes('No matching videos found')) {
                throw error;
            }
            
            throw new Error('YouTube search temporarily unavailable. Please try again later.');
        }
    }

    async fallbackYouTubeSearch(query, maxResults = 5) {
        try {
            logger.info(`Using fallback search for: ${query}`);
            
            // In fallback mode, we cannot provide real YouTube URLs
            // We need to return empty results or throw an error
            logger.warn('YouTube search is temporarily unavailable due to API restrictions');
            throw new Error('YouTube search is temporarily unavailable. Please try again later.');
        } catch (error) {
            logger.error('Fallback search failed:', error.message);
            throw new Error('YouTube search is temporarily unavailable. Please try again later.');
        }
    }

    async findBestMatch(spotifyTrack) {
        const artists = spotifyTrack.artists.map(a => a.name).join(' ');
        const searchQuery = `${artists} ${spotifyTrack.name}`;
        
        console.log('=== FIND BEST MATCH DEBUG ===');
        console.log('Spotify track:', spotifyTrack.name);
        console.log('Artists:', artists);
        console.log('Search query:', searchQuery);
        
        logger.info(`Searching YouTube for: ${searchQuery}`);
        
        const searchResults = await this.searchYouTube(searchQuery, 10);
        
        console.log('Search results received:', searchResults.length);
        
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
            
            console.log(`Video: ${result.title} | Score: ${score} | Duration: ${duration}s`);
            
            return { ...result, score };
        });
        
        scoredResults.sort((a, b) => b.score - a.score);
        
        console.log('Best match selected:', scoredResults[0].title, 'Score:', scoredResults[0].score);
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
        return new Promise(async (resolve, reject) => {
            try {
                console.log('=== YOUTUBE DOWNLOAD DEBUG ===');
                console.log('Video URL:', videoUrl);
                console.log('Output path:', outputPath);
                console.log('Format:', format, 'Quality:', quality);
                
                // Validate inputs
                if (!videoUrl || !outputPath) {
                    throw new Error('Invalid download parameters provided');
                }
                
                // Set timeout for download
                const downloadTimeout = setTimeout(() => {
                    reject(new Error('Download timed out after 5 minutes'));
                }, 5 * 60 * 1000); // 5 minutes
                
                // Try yt-dlp first (more reliable)
                try {
                    console.log('Trying yt-dlp download...');
                    
                    const options = {
                        output: outputPath,
                        format: format === 'mp3' ? 'bestaudio[ext=m4a]/bestaudio' : 'best[ext=mp4]',
                        extractAudio: format === 'mp3',
                        audioFormat: format === 'mp3' ? 'mp3' : undefined,
                        audioQuality: format === 'mp3' ? quality : undefined,
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    };
                    
                    await youtubedl(videoUrl, options);
                    
                    console.log(`yt-dlp download completed: ${outputPath}`);
                    logger.info(`yt-dlp download completed: ${outputPath}`);
                    clearTimeout(downloadTimeout);
                    resolve(outputPath);
                    return;
                } catch (ytdlpError) {
                    console.log('yt-dlp download failed, trying ytdl-core...', ytdlpError.message);
                }
                
                // Fallback to ytdl-core
                console.log('Trying ytdl-core download...');
                const stream = ytdl(videoUrl, {
                    quality: 'highestaudio',
                    filter: 'audioonly',
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    }
                });

                stream.on('error', (err) => {
                    console.error('Stream error:', err);
                    clearTimeout(downloadTimeout);
                    
                    // More specific error messages
                    let errorMessage = 'Failed to download audio from YouTube';
                    if (err.message.includes('unavailable')) {
                        errorMessage = 'Video is not available for download';
                    } else if (err.message.includes('private')) {
                        errorMessage = 'Video is private and cannot be downloaded';
                    } else if (err.message.includes('restricted')) {
                        errorMessage = 'Video is restricted and cannot be downloaded';
                    } else if (err.message.includes('429')) {
                        errorMessage = 'YouTube rate limit exceeded. Please try again later';
                    }
                    
                    logger.error(`Stream error: ${err.message}`, { videoUrl, outputPath });
                    reject(new Error(errorMessage));
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
                            console.log(`Download progress: ${progress.percent}%`);
                            logger.debug(`Download progress: ${progress.percent}%`);
                        })
                        .on('end', () => {
                            console.log(`Download completed: ${outputPath} (${quality}kbps)`);
                            logger.info(`Download completed: ${outputPath} (${quality}kbps)`);
                            clearTimeout(downloadTimeout);
                            resolve(outputPath);
                        })
                        .on('error', (err) => {
                            console.error(`Download failed: ${err.message}`);
                            logger.error(`Download failed: ${err.message}`, { videoUrl, outputPath });
                            clearTimeout(downloadTimeout);
                            
                            // More specific FFmpeg error messages
                            let errorMessage = 'Audio processing failed';
                            if (err.message.includes('codec')) {
                                errorMessage = 'Audio codec not supported';
                            } else if (err.message.includes('permission')) {
                                errorMessage = 'File permission error';
                            } else if (err.message.includes('space')) {
                                errorMessage = 'Not enough disk space';
                            }
                            
                            reject(new Error(errorMessage));
                        });
                } else {
                    const writeStream = fs.createWriteStream(outputPath);
                    stream.pipe(writeStream);
                    
                    writeStream.on('finish', () => {
                        console.log(`Download completed: ${outputPath}`);
                        logger.info(`Download completed: ${outputPath}`);
                        resolve(outputPath);
                    });
                    
                    writeStream.on('error', (err) => {
                        console.error(`Download failed: ${err.message}`);
                        logger.error(`Download failed: ${err.message}`);
                        reject(err);
                    });
                }
            } catch (error) {
                console.error(`Download initialization failed: ${error.message}`);
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
                partOfSet: metadata.discNumber
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
            const initialStatus = {
                status: 'processing',
                progress: 0,
                message: 'Getting track information...'
            };
            this.activeDownloads.set(jobId, initialStatus);
            this.emitProgress(jobId, initialStatus);

            // Parse Spotify URL and get track data
            const parsed = await spotifyService.parseSpotifyUrlAndGetData(spotifyUrl);
            const track = parsed.data;

            // Update status
            const searchStatus = {
                status: 'processing',
                progress: 25,
                message: 'Searching for audio source...'
            };
            this.activeDownloads.set(jobId, searchStatus);
            this.emitProgress(jobId, searchStatus);

            // Find best YouTube match
            const youtubeVideo = await this.findBestMatch(track);

            // Create filename
            const artists = track.artists.map(a => a.name).join(', ');
            const filename = sanitize(`${artists} - ${track.name}.${format}`);
            const outputPath = path.join(this.downloadPath, filename);

            // Update status
            const downloadStatus = {
                status: 'downloading',
                progress: 50,
                message: 'Downloading audio...'
            };
            this.activeDownloads.set(jobId, downloadStatus);
            this.emitProgress(jobId, downloadStatus);

            // Download from YouTube
            await this.downloadFromYouTube(youtubeVideo.url, outputPath, format, quality);

            // Update status
            const metadataStatus = {
                status: 'processing',
                progress: 75,
                message: 'Adding metadata...'
            };
            this.activeDownloads.set(jobId, metadataStatus);
            this.emitProgress(jobId, metadataStatus);

            // Add metadata
            await this.addMetadata(outputPath, {
                title: track.name,
                artist: artists,
                album: track.album.name,
                year: track.album.release_date ? new Date(track.album.release_date).getFullYear() : null,
                image: track.album.images[0]?.url
            });

            // Update status
            const completedStatus = {
                status: 'completed',
                progress: 100,
                message: 'Download completed',
                filename: filename,
                filePath: outputPath,
                fileSize: fs.statSync(outputPath).size
            };
            this.activeDownloads.set(jobId, completedStatus);
            this.emitProgress(jobId, completedStatus);

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
            
            const errorStatus = {
                status: 'failed',
                progress: 0,
                message: error.message
            };
            this.activeDownloads.set(jobId, errorStatus);
            this.emitProgress(jobId, errorStatus);

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
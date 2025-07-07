const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sanitize = require('sanitize-filename');
const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');
const logger = require('../utils/logger');

class YouTubeService {
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

    async getVideoInfo(url) {
        try {
            const info = await ytdl.getInfo(url, {
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                }
            });
            const videoDetails = info.videoDetails;
            
            return {
                id: videoDetails.videoId,
                title: videoDetails.title,
                description: videoDetails.description,
                lengthSeconds: parseInt(videoDetails.lengthSeconds),
                viewCount: parseInt(videoDetails.viewCount),
                author: {
                    id: videoDetails.author.id,
                    name: videoDetails.author.name,
                    user: videoDetails.author.user,
                    channelUrl: videoDetails.author.channel_url,
                    userUrl: videoDetails.author.user_url
                },
                uploadDate: videoDetails.uploadDate,
                thumbnails: videoDetails.thumbnails,
                keywords: videoDetails.keywords,
                category: videoDetails.category,
                isLiveContent: videoDetails.isLiveContent,
                url: videoDetails.video_url
            };
        } catch (error) {
            logger.error('Failed to get YouTube video info:', error.message);
            throw new Error('Failed to get video information');
        }
    }

    async downloadVideo(url, format = 'mp3', quality = '320') {
        const jobId = uuidv4();
        
        try {
            // Update status
            this.activeDownloads.set(jobId, {
                status: 'processing',
                progress: 0,
                message: 'Getting video information...'
            });

            // Get video info
            const videoInfo = await this.getVideoInfo(url);
            
            // Update status
            this.activeDownloads.set(jobId, {
                status: 'processing',
                progress: 25,
                message: 'Preparing download...'
            });

            // Create filename
            const filename = sanitize(`${videoInfo.title}.${format}`);
            const outputPath = path.join(this.downloadPath, filename);

            // Update status
            this.activeDownloads.set(jobId, {
                status: 'downloading',
                progress: 50,
                message: 'Downloading video...'
            });

            // Download video
            await this.downloadFromYouTube(url, outputPath, format, quality);

            // Update status
            this.activeDownloads.set(jobId, {
                status: 'processing',
                progress: 75,
                message: 'Adding metadata...'
            });

            // Add metadata
            await this.addMetadata(outputPath, {
                title: videoInfo.title,
                artist: videoInfo.author.name,
                album: 'YouTube',
                year: videoInfo.uploadDate ? new Date(videoInfo.uploadDate).getFullYear() : null,
                image: videoInfo.thumbnails[videoInfo.thumbnails.length - 1]?.url
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
                type: 'youtube',
                title: videoInfo.title,
                author: videoInfo.author.name,
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
                downloadUrl: `/api/download/file/${jobId}`,
                videoInfo: {
                    title: videoInfo.title,
                    author: videoInfo.author.name,
                    duration: videoInfo.lengthSeconds
                }
            };

        } catch (error) {
            logger.error(`YouTube download failed for job ${jobId}:`, error.message);
            
            this.activeDownloads.set(jobId, {
                status: 'failed',
                progress: 0,
                message: error.message
            });

            throw error;
        }
    }

    async downloadFromYouTube(videoUrl, outputPath, format = 'mp3', quality = '320') {
        return new Promise(async (resolve, reject) => {
            try {
                // Determine if this is video or audio download
                const isVideoFormat = ['mp4', 'webm', 'avi'].includes(format);
                const isAudioQuality = ['64', '128', '192', '256', '320'].includes(quality);
                
                if (isVideoFormat && !isAudioQuality) {
                    // Video download - direct download without conversion first
                    const videoStream = ytdl(videoUrl, { 
                        quality: 'highest',
                        requestOptions: {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        }
                    });
                    
                    // Simple direct download first, then convert if needed
                    const writeStream = fs.createWriteStream(outputPath);
                    videoStream.pipe(writeStream);
                    
                    writeStream.on('finish', () => {
                        logger.info(`YouTube video download completed: ${outputPath} (${quality}p)`);
                        resolve(outputPath);
                    });
                    
                    writeStream.on('error', (err) => {
                        logger.error(`YouTube video download failed: ${err.message}`);
                        reject(err);
                    });
                    
                    return;
                }

                // Audio download
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
                            logger.debug(`YouTube download progress: ${progress.percent}%`);
                        })
                        .on('end', () => {
                            logger.info(`YouTube download completed: ${outputPath} (${quality}kbps)`);
                            resolve(outputPath);
                        })
                        .on('error', (err) => {
                            logger.error(`YouTube download failed: ${err.message}`);
                            reject(err);
                        });
                } else {
                    // Direct stream download for other formats
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
                comment: 'Downloaded from YouTube via eezyGet'
            };

            // Download and add thumbnail if available
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
                        description: 'Thumbnail',
                        imageBuffer: buffer
                    };
                } catch (error) {
                    logger.warn(`Failed to download thumbnail: ${error.message}`);
                }
            }

            NodeID3.write(tags, filePath);
            logger.info(`Metadata added to: ${filePath}`);
        } catch (error) {
            logger.error(`Failed to add metadata: ${error.message}`);
        }
    }

    async searchVideos(query, limit = 10) {
        try {
            const ytsr = require('ytsr');
            const searchResults = await ytsr(query, { limit });
            
            return searchResults.items
                .filter(item => item.type === 'video')
                .map(item => ({
                    id: item.id,
                    title: item.title,
                    duration: item.duration,
                    url: item.url,
                    thumbnail: item.bestThumbnail?.url,
                    views: item.views,
                    uploadDate: item.uploadedAt,
                    author: {
                        name: item.author?.name,
                        channelUrl: item.author?.channelUrl
                    }
                }));
        } catch (error) {
            logger.error('YouTube search failed:', error.message);
            throw new Error('Failed to search YouTube');
        }
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

module.exports = new YouTubeService();

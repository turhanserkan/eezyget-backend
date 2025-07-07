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
              const info = await ytdl.getInfo(url);
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
                  year: videoInfo.uploadDate ? new
  Date(videoInfo.uploadDate).getFullYear() : null,
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
              logger.error(`YouTube download failed for job ${jobId}:`,
  error.message);

              this.activeDownloads.set(jobId, {
                  status: 'failed',
                  progress: 0,
                  message: error.message
              });

              throw error;
          }
      }

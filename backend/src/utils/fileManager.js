const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const logger = require('./logger');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

class FileManager {
    constructor() {
        this.downloadPath = path.join(__dirname, '../../downloads');
        this.tempPath = path.join(__dirname, '../../temp');
        this.maxFileAge = 24 * 60 * 60 * 1000; // 24 hours
        this.maxTotalSize = 5 * 1024 * 1024 * 1024; // 5GB
        
        // Start cleanup interval
        this.startCleanupInterval();
    }

    async ensureDirectoryExists(dirPath) {
        try {
            await fs.promises.access(dirPath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.promises.mkdir(dirPath, { recursive: true });
                logger.info(`Created directory: ${dirPath}`);
            } else {
                throw error;
            }
        }
    }

    async getFileInfo(filePath) {
        try {
            const stats = await stat(filePath);
            return {
                path: filePath,
                size: stats.size,
                created: stats.ctime,
                modified: stats.mtime,
                accessed: stats.atime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            logger.error(`Failed to get file info for ${filePath}:`, error.message);
            return null;
        }
    }

    async getDirectorySize(dirPath) {
        try {
            const files = await readdir(dirPath);
            let totalSize = 0;

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await stat(filePath);
                
                if (stats.isFile()) {
                    totalSize += stats.size;
                } else if (stats.isDirectory()) {
                    totalSize += await this.getDirectorySize(filePath);
                }
            }

            return totalSize;
        } catch (error) {
            logger.error(`Failed to get directory size for ${dirPath}:`, error.message);
            return 0;
        }
    }

    async cleanupOldFiles() {
        const directories = [this.downloadPath, this.tempPath];
        let totalCleaned = 0;
        let totalSize = 0;

        for (const dir of directories) {
            try {
                const files = await readdir(dir);
                const now = Date.now();

                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stats = await stat(filePath);
                    
                    // Check if file is older than maxFileAge
                    if (now - stats.mtime.getTime() > this.maxFileAge) {
                        if (stats.isFile()) {
                            await unlink(filePath);
                            totalCleaned++;
                            totalSize += stats.size;
                            logger.info(`Cleaned up old file: ${filePath}`);
                        } else if (stats.isDirectory()) {
                            await this.removeDirectory(filePath);
                            logger.info(`Cleaned up old directory: ${filePath}`);
                        }
                    }
                }
            } catch (error) {
                logger.error(`Failed to cleanup directory ${dir}:`, error.message);
            }
        }

        if (totalCleaned > 0) {
            logger.info(`Cleanup completed: ${totalCleaned} files removed, ${this.formatBytes(totalSize)} freed`);
        }

        return { filesRemoved: totalCleaned, sizeFreed: totalSize };
    }

    async removeDirectory(dirPath) {
        try {
            const files = await readdir(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await stat(filePath);
                
                if (stats.isDirectory()) {
                    await this.removeDirectory(filePath);
                } else {
                    await unlink(filePath);
                }
            }
            
            await rmdir(dirPath);
        } catch (error) {
            logger.error(`Failed to remove directory ${dirPath}:`, error.message);
        }
    }

    async checkDiskSpace() {
        try {
            const downloadSize = await this.getDirectorySize(this.downloadPath);
            const tempSize = await this.getDirectorySize(this.tempPath);
            const totalSize = downloadSize + tempSize;

            return {
                downloadSize,
                tempSize,
                totalSize,
                maxSize: this.maxTotalSize,
                usagePercentage: (totalSize / this.maxTotalSize) * 100,
                isOverLimit: totalSize > this.maxTotalSize
            };
        } catch (error) {
            logger.error('Failed to check disk space:', error.message);
            return null;
        }
    }

    async cleanupBySize() {
        const spaceInfo = await this.checkDiskSpace();
        
        if (!spaceInfo || !spaceInfo.isOverLimit) {
            return { filesRemoved: 0, sizeFreed: 0 };
        }

        logger.warn(`Disk space limit exceeded: ${this.formatBytes(spaceInfo.totalSize)} / ${this.formatBytes(spaceInfo.maxSize)}`);

        const directories = [this.downloadPath, this.tempPath];
        let totalCleaned = 0;
        let totalSize = 0;
        const filesToDelete = [];

        // Collect all files with their stats
        for (const dir of directories) {
            try {
                const files = await readdir(dir);
                
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stats = await stat(filePath);
                    
                    if (stats.isFile()) {
                        filesToDelete.push({
                            path: filePath,
                            size: stats.size,
                            mtime: stats.mtime
                        });
                    }
                }
            } catch (error) {
                logger.error(`Failed to read directory ${dir}:`, error.message);
            }
        }

        // Sort by modification time (oldest first)
        filesToDelete.sort((a, b) => a.mtime - b.mtime);

        // Delete files until we're under the limit
        for (const file of filesToDelete) {
            if (spaceInfo.totalSize - totalSize <= this.maxTotalSize) {
                break;
            }

            try {
                await unlink(file.path);
                totalCleaned++;
                totalSize += file.size;
                logger.info(`Cleaned up file for space: ${file.path}`);
            } catch (error) {
                logger.error(`Failed to delete file ${file.path}:`, error.message);
            }
        }

        logger.info(`Space cleanup completed: ${totalCleaned} files removed, ${this.formatBytes(totalSize)} freed`);
        return { filesRemoved: totalCleaned, sizeFreed: totalSize };
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    startCleanupInterval() {
        const interval = parseInt(process.env.CLEANUP_INTERVAL) || 3600000; // 1 hour
        
        setInterval(async () => {
            logger.info('Starting scheduled cleanup...');
            await this.cleanupOldFiles();
            await this.cleanupBySize();
        }, interval);

        logger.info(`File cleanup scheduled every ${interval / 1000} seconds`);
    }

    async getStorageStats() {
        const spaceInfo = await this.checkDiskSpace();
        
        return {
            ...spaceInfo,
            downloadSizeFormatted: this.formatBytes(spaceInfo.downloadSize),
            tempSizeFormatted: this.formatBytes(spaceInfo.tempSize),
            totalSizeFormatted: this.formatBytes(spaceInfo.totalSize),
            maxSizeFormatted: this.formatBytes(spaceInfo.maxSize)
        };
    }
}

module.exports = new FileManager();
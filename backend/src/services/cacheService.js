const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        // Different cache instances for different data types
        this.searchCache = new NodeCache({
            stdTTL: 300, // 5 minutes
            checkperiod: 120, // Check for expired keys every 2 minutes
            useClones: false
        });
        
        this.metadataCache = new NodeCache({
            stdTTL: 1800, // 30 minutes - metadata doesn't change often
            checkperiod: 300,
            useClones: false
        });
        
        this.healthCache = new NodeCache({
            stdTTL: 60, // 1 minute
            checkperiod: 30,
            useClones: false
        });
        
        // Setup cache event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const caches = [
            { name: 'search', cache: this.searchCache },
            { name: 'metadata', cache: this.metadataCache },
            { name: 'health', cache: this.healthCache }
        ];
        
        caches.forEach(({ name, cache }) => {
            cache.on('set', (key, value) => {
                logger.debug(`Cache SET [${name}]: ${key}`);
            });
            
            cache.on('del', (key, value) => {
                logger.debug(`Cache DEL [${name}]: ${key}`);
            });
            
            cache.on('expired', (key, value) => {
                logger.debug(`Cache EXPIRED [${name}]: ${key}`);
            });
        });
    }
    
    // YouTube search cache
    getCachedSearch(query) {
        const key = `youtube_search:${query}`;
        return this.searchCache.get(key);
    }
    
    setCachedSearch(query, results) {
        const key = `youtube_search:${query}`;
        this.searchCache.set(key, results);
    }
    
    // Spotify metadata cache
    getCachedMetadata(spotifyId) {
        const key = `spotify_metadata:${spotifyId}`;
        return this.metadataCache.get(key);
    }
    
    setCachedMetadata(spotifyId, metadata) {
        const key = `spotify_metadata:${spotifyId}`;
        this.metadataCache.set(key, metadata);
    }
    
    // Health check cache
    getCachedHealth() {
        return this.healthCache.get('system_health');
    }
    
    setCachedHealth(healthData) {
        this.healthCache.set('system_health', healthData);
    }
    
    // Generic cache methods
    get(cacheType, key) {
        const cache = this.getCache(cacheType);
        return cache ? cache.get(key) : null;
    }
    
    set(cacheType, key, value, ttl) {
        const cache = this.getCache(cacheType);
        if (cache) {
            cache.set(key, value, ttl);
        }
    }
    
    del(cacheType, key) {
        const cache = this.getCache(cacheType);
        if (cache) {
            cache.del(key);
        }
    }
    
    getCache(type) {
        switch (type) {
            case 'search': return this.searchCache;
            case 'metadata': return this.metadataCache;
            case 'health': return this.healthCache;
            default: return null;
        }
    }
    
    // Cache statistics
    getStats() {
        return {
            search: this.searchCache.getStats(),
            metadata: this.metadataCache.getStats(),
            health: this.healthCache.getStats()
        };
    }
    
    // Clear all caches
    clearAll() {
        this.searchCache.flushAll();
        this.metadataCache.flushAll();
        this.healthCache.flushAll();
        logger.info('All caches cleared');
    }
    
    // Clear specific cache
    clear(cacheType) {
        const cache = this.getCache(cacheType);
        if (cache) {
            cache.flushAll();
            logger.info(`Cache cleared: ${cacheType}`);
        }
    }
}

module.exports = new CacheService();
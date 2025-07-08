const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class SpotifyService {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
        this.accessToken = null;
        this.tokenExpiry = null;
        this.baseUrl = 'https://api.spotify.com/v1';
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry > Date.now()) {
            return this.accessToken;
        }

        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Spotify credentials not configured');
        }

        try {
            const response = await axios.post(
                'https://accounts.spotify.com/api/token',
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            
            logger.info('Spotify access token obtained successfully');
            return this.accessToken;
        } catch (error) {
            logger.error('Failed to get Spotify access token:', error.message);
            throw new Error('Failed to authenticate with Spotify');
        }
    }

    async makeRequest(endpoint) {
        const cacheKey = `spotify:${endpoint}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            logger.debug(`Cache hit for ${endpoint}`);
            return cached;
        }

        try {
            const token = await this.getAccessToken();
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            this.cache.set(cacheKey, response.data);
            logger.debug(`API request successful: ${endpoint}`);
            return response.data;
        } catch (error) {
            logger.error(`Spotify API request failed: ${endpoint}`, error.message);
            if (error.response?.status === 404) {
                throw new Error('Track, album, or playlist not found');
            }
            throw new Error('Failed to fetch data from Spotify');
        }
    }

    async getTrack(trackId) {
        const data = await this.makeRequest(`/tracks/${trackId}`);
        
        return {
            id: data.id,
            name: data.name,
            artists: data.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            })),
            album: {
                id: data.album.id,
                name: data.album.name,
                images: data.album.images
            },
            duration_ms: data.duration_ms,
            explicit: data.explicit,
            popularity: data.popularity,
            preview_url: data.preview_url,
            external_urls: data.external_urls
        };
    }

    async getPlaylist(playlistId) {
        const data = await this.makeRequest(`/playlists/${playlistId}`);
        
        const tracks = await this.getPlaylistTracks(playlistId);
        
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            owner: {
                id: data.owner.id,
                display_name: data.owner.display_name
            },
            public: data.public,
            collaborative: data.collaborative,
            followers: data.followers.total,
            images: data.images,
            tracks: {
                total: data.tracks.total,
                items: tracks
            },
            external_urls: data.external_urls
        };
    }

    async getPlaylistTracks(playlistId, limit = 100) {
        const tracks = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const data = await this.makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
            
            const validTracks = data.items
                .filter(item => item.track && item.track.id)
                .map(item => ({
                    id: item.track.id,
                    name: item.track.name,
                    artists: item.track.artists.map(artist => ({
                        id: artist.id,
                        name: artist.name
                    })),
                    album: {
                        id: item.track.album.id,
                        name: item.track.album.name,
                        images: item.track.album.images
                    },
                    duration_ms: item.track.duration_ms,
                    explicit: item.track.explicit,
                    popularity: item.track.popularity,
                    preview_url: item.track.preview_url,
                    added_at: item.added_at
                }));

            tracks.push(...validTracks);
            
            hasMore = data.next !== null;
            offset += limit;
        }

        return tracks;
    }

    async getAlbum(albumId) {
        const data = await this.makeRequest(`/albums/${albumId}`);
        
        return {
            id: data.id,
            name: data.name,
            artists: data.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            })),
            album_type: data.album_type,
            total_tracks: data.total_tracks,
            release_date: data.release_date,
            images: data.images,
            genres: data.genres,
            popularity: data.popularity,
            tracks: {
                total: data.tracks.total,
                items: data.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists.map(artist => ({
                        id: artist.id,
                        name: artist.name
                    })),
                    duration_ms: track.duration_ms,
                    explicit: track.explicit,
                    preview_url: track.preview_url,
                    track_number: track.track_number,
                    disc_number: track.disc_number
                }))
            },
            external_urls: data.external_urls
        };
    }

    async search(query, type = 'track', limit = 20) {
        const encodedQuery = encodeURIComponent(query);
        const data = await this.makeRequest(`/search?q=${encodedQuery}&type=${type}&limit=${limit}`);
        
        return data;
    }

    parseSpotifyUrl(url) {
        const regex = /https:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)(\?.*)?/;
        const match = url.match(regex);
        
        if (!match) {
            throw new Error('Invalid Spotify URL');
        }
        
        return {
            type: match[1],
            id: match[2],
            url: url
        };
    }

    async parseSpotifyUrlAndGetData(url) {
        const parsed = this.parseSpotifyUrl(url);
        
        let data;
        switch (parsed.type) {
            case 'track':
                data = await this.getTrack(parsed.id);
                break;
            case 'album':
                data = await this.getAlbum(parsed.id);
                break;
            case 'playlist':
                data = await this.getPlaylist(parsed.id);
                break;
            default:
                throw new Error('Unsupported Spotify URL type');
        }
        
        return {
            ...parsed,
            data
        };
    }
}

module.exports = new SpotifyService();
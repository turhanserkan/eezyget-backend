# SpotIndir Backend

Backend API server for SpotIndir - Spotify music downloader.

## Features

- **Spotify API Integration**: Fetch track, album, and playlist metadata
- **YouTube Search & Download**: Find and download audio from YouTube
- **Audio Processing**: Convert and enhance audio quality with FFmpeg
- **Metadata Management**: Add ID3 tags with album art
- **File Management**: Automatic cleanup and storage optimization
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Error Handling**: Comprehensive error handling and logging
- **Security**: CORS, Helmet, and input validation

## Prerequisites

- Node.js 18+ and npm 9+
- FFmpeg (for audio processing)
- Spotify Developer Account (for API access)

## Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install FFmpeg**:
   
   **Windows (using Chocolatey)**:
   ```bash
   choco install ffmpeg
   ```
   
   **macOS (using Homebrew)**:
   ```bash
   brew install ffmpeg
   ```
   
   **Linux (Ubuntu/Debian)**:
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Spotify API Configuration
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   
   # API Configuration
   API_BASE_URL=http://localhost:3001
   FRONTEND_URL=http://localhost:3000
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

## Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the Client ID and Client Secret
4. Add them to your `.env` file

## Usage

1. **Development**:
   ```bash
   npm run dev
   ```

2. **Production**:
   ```bash
   npm start
   ```

3. **Test API**:
   ```bash
   curl http://localhost:3001/health
   ```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Spotify API
- `GET /api/spotify/track/:id` - Get track information
- `GET /api/spotify/playlist/:id` - Get playlist information
- `GET /api/spotify/album/:id` - Get album information
- `POST /api/spotify/parse` - Parse Spotify URL
- `GET /api/spotify/search` - Search Spotify catalog

### Download API
- `POST /api/download/track` - Download single track
- `POST /api/download/playlist` - Download playlist as ZIP
- `POST /api/download/album` - Download album as ZIP
- `GET /api/download/status/:jobId` - Get download status
- `GET /api/download/file/:fileId` - Download file

## Project Structure

```
backend/
├── src/
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── downloads/           # Downloaded files
├── temp/               # Temporary files
├── logs/               # Log files
└── package.json
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `LOG_LEVEL`: Logging level (error/warn/info/debug)

### Rate Limiting

Default configuration:
- Window: 15 minutes
- Max requests: 100 per window per IP

### File Management

- Auto-cleanup: Files older than 24 hours
- Storage limit: 5GB total
- Supported formats: MP3, WAV, FLAC
- Quality options: 128, 192, 256, 320 kbps

## Security

- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Joi schema validation
- **Error Handling**: No sensitive data exposure

## Logging

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions

## Development

### Scripts

- `npm run dev` - Development with nodemon
- `npm run start` - Production start
- `npm run test` - Run tests
- `npm run lint` - ESLint check
- `npm run format` - Prettier format

### Testing

```bash
npm test
```

## Deployment

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Set production environment**:
   ```bash
   export NODE_ENV=production
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

## Legal Notice

This software is for educational purposes only. Users are responsible for complying with copyright laws and terms of service of third-party platforms.

## License

MIT License - see LICENSE file for details.
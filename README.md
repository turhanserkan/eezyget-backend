# eezyGet - Multi-Platform Downloader

A modern web application for downloading music from Spotify and videos from YouTube.

## Features
- 🎵 Spotify track, album, and playlist downloads
- 📹 YouTube video and audio downloads  
- 🌍 Multi-language support (11 languages)
- 📱 Responsive design for all devices
- ⚡ Fast download speeds
- 🔒 Secure and safe

## Deployment Instructions

### Frontend (Static Files)
1. Upload these files to your Hostinger public_html folder:
   - `index.html`
   - `spotify.html` 
   - `youtube.html`
   - `assets/` folder (CSS, JS, images)

### Backend (if Node.js supported)
1. Upload `backend/` folder to your server
2. Install dependencies: `npm install`
3. Set environment variables from `.env.production`
4. Start server: `npm run production`

### Domain Setup
- Main site: `https://eezyget.com`
- API endpoint: `https://api.eezyget.com`

## File Structure
```
/
├── index.html              # Homepage
├── spotify.html           # Spotify downloader
├── youtube.html           # YouTube downloader  
├── assets/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── images/            # Images and icons
├── backend/               # Node.js backend
│   ├── src/               # Source code
│   ├── package.json       # Dependencies
│   └── .env.production    # Production config
└── README.md              # This file
```

## Requirements
- Node.js 16+
- Modern web browser
- HTTPS enabled domain

## License
MIT License - see LICENSE file for details
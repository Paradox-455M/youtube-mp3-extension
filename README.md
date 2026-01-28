# YouTube to MP3 Converter Extension

A browser extension that converts YouTube videos to MP3 files locally using a Node.js backend server.

## Features

- 🎵 Convert YouTube videos to MP3 format
- 🚀 Fast local conversion using yt-dlp
- 🎨 Modern, user-friendly interface
- 🔒 Privacy-focused (all processing happens locally)
- 🌐 Cross-platform support (Windows, macOS, Linux)

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **FFmpeg**
   - **macOS**: `brew install ffmpeg`
   - **Linux (Ubuntu/Debian)**: `sudo apt-get install ffmpeg`
   - **Linux (Fedora)**: `sudo dnf install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
   - Verify installation: `ffmpeg -version`

3. **yt-dlp**
   - **macOS/Linux**: `brew install yt-dlp` or `pip install yt-dlp`
   - **Windows**: `pip install yt-dlp` or download from [GitHub](https://github.com/yt-dlp/yt-dlp)
   - Verify installation: `yt-dlp --version`

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd youtube-mp3-extension
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables (Optional)

Create a `.env` file in the `backend` directory:

```env
# Server port (default: 4000)
PORT=4000

# FFmpeg path (auto-detected if not set)
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
FFPROBE_PATH=/opt/homebrew/bin/ffprobe

# Maximum file size in bytes (default: 100MB)
MAX_FILE_SIZE=104857600

# File cleanup time in milliseconds (default: 1 hour)
FILE_CLEANUP_TIME=3600000

# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID,http://localhost:4000
```

### 4. Start the Backend Server

```bash
npm start
```

The server will start on `http://localhost:4000` (or your configured PORT).

### 5. Load the Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this repository
5. Note your extension ID (you may need to update CORS settings)

## Usage

1. Navigate to any YouTube video
2. Click the extension icon in your browser toolbar
3. Paste the YouTube URL (or it may auto-detect from current tab)
4. Click "Convert to MP3"
5. Wait for conversion to complete
6. The MP3 file will automatically download

## Project Structure

```
youtube-mp3-extension/
├── backend/
│   ├── server.js          # Main server file
│   ├── config.js          # Configuration
│   ├── utils/             # Utility functions
│   │   ├── ffmpegFinder.js
│   │   ├── validators.js
│   │   └── fileCleanup.js
│   ├── temp/              # Temporary MP3 files (auto-cleaned)
│   └── package.json
├── extension/
│   ├── manifest.json      # Extension manifest
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   ├── background.js      # Background service worker
│   └── icons/             # Extension icons
├── .gitignore
├── README.md
└── IMPROVEMENTS.md        # Improvement suggestions
```

## API Endpoints

### POST `/convert`
Convert a YouTube video to MP3.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "http://localhost:4000/download/filename.mp3",
  "title": "Video Title",
  "fileSize": 5242880
}
```

### GET `/download/:filename`
Download a converted MP3 file.

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "ffmpeg": "available",
  "timestamp": "2026-01-28T12:00:00.000Z"
}
```

## Troubleshooting

### FFmpeg Not Found
- Ensure FFmpeg is installed and in your PATH
- Or set `FFMPEG_PATH` environment variable
- Verify with: `ffmpeg -version`

### yt-dlp Not Found
- Ensure yt-dlp is installed and in your PATH
- Verify with: `yt-dlp --version`
- Update yt-dlp if outdated: `pip install --upgrade yt-dlp`

### Conversion Fails
- Check that the YouTube URL is valid
- Ensure the video is not age-restricted or private
- Try updating yt-dlp: `pip install --upgrade yt-dlp`
- Check server logs for detailed error messages

### CORS Errors
- Update `ALLOWED_ORIGINS` in config.js with your extension ID
- Or set `ALLOWED_ORIGINS` environment variable

### Port Already in Use
- Change the PORT in `.env` file
- Or set `PORT` environment variable: `PORT=4001 npm start`

## Development

### Running in Development Mode

```bash
# Backend
cd backend
npm start

# Extension
# Load unpacked extension in Chrome with Developer mode enabled
```

### Code Structure

- **Backend**: Express.js server handling conversion requests
- **Extension**: Chrome Extension Manifest V3 with popup UI
- **Utils**: Cross-platform utilities for FFmpeg detection, validation, and cleanup

## Security Notes

- All processing happens locally on your machine
- Temporary files are automatically cleaned up
- File size limits are enforced to prevent abuse
- Input validation prevents malicious URLs
- CORS is configured to restrict origins

## Limitations

- Requires FFmpeg and yt-dlp to be installed
- Conversion speed depends on video length and your internet connection
- Large files may take significant time to convert
- Some videos may be restricted by YouTube

## Contributing

Contributions are welcome! Please see `IMPROVEMENTS.md` for areas that need improvement.

## License

ISC

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloader
- [FFmpeg](https://ffmpeg.org/) - Multimedia framework
- [Express.js](https://expressjs.com/) - Web framework

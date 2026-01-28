# Changelog

## [Unreleased] - Improvements Implemented

### ✅ Security Improvements

- **Cross-platform FFmpeg detection**: Auto-detects FFmpeg paths on Windows, macOS, and Linux
- **Environment variable support**: FFmpeg paths can now be configured via environment variables
- **Input validation**: Added robust YouTube URL validation on both frontend and backend
- **Filename sanitization**: Prevents directory traversal attacks and invalid filenames
- **File size enforcement**: Actually enforces MAX_FILE_SIZE limit (was in config but not used)
- **CORS configuration**: Made CORS origins configurable via environment variables

### ✅ Code Quality Improvements

- **Modular code structure**: Split utilities into separate files (`utils/ffmpegFinder.js`, `utils/validators.js`, `utils/fileCleanup.js`)
- **Better error handling**: More specific error messages with actionable information
- **Health check endpoint**: Added `/health` endpoint for monitoring
- **Removed unused dependencies**: Removed `ytdl-core` and `archiver` (not used in code)
- **Improved logging**: Better structured console logging

### ✅ User Experience Improvements

- **Auto-detect URL**: Extension now auto-detects YouTube URL from current tab
- **Keyboard shortcuts**: Enter key now triggers conversion
- **Visual feedback**: URL input shows visual feedback for invalid URLs
- **Better error messages**: More user-friendly error messages

### ✅ DevOps Improvements

- **`.gitignore` file**: Added comprehensive `.gitignore` to exclude temp files, node_modules, etc.
- **Environment configuration**: Added `.env.example` file for easy configuration
- **Comprehensive README**: Added detailed setup instructions, troubleshooting, and API documentation

### ✅ Maintenance Improvements

- **Automatic file cleanup**: Temp files are cleaned up on startup and periodically
- **File size monitoring**: Better tracking and enforcement of file size limits
- **Cross-platform support**: Works on Windows, macOS, and Linux

## Files Changed

### New Files
- `.gitignore` - Git ignore rules
- `IMPROVEMENTS.md` - Comprehensive improvement recommendations
- `CHANGELOG.md` - This file
- `backend/utils/ffmpegFinder.js` - Cross-platform FFmpeg detection
- `backend/utils/validators.js` - Input validation utilities
- `backend/utils/fileCleanup.js` - Automatic file cleanup
- `backend/.env.example` - Environment variable template

### Modified Files
- `README.md` - Complete rewrite with comprehensive documentation
- `backend/server.js` - Major improvements (validation, cleanup, cross-platform support)
- `backend/config.js` - Environment variable support
- `backend/package.json` - Removed unused dependencies
- `extension/popup.js` - Auto-detect URL, keyboard shortcuts, better validation

## Next Steps (From IMPROVEMENTS.md)

### High Priority
- [ ] Real progress tracking (parse yt-dlp output)
- [ ] Structured logging (Winston/Pino)
- [ ] Code organization (split into routes/controllers/services)
- [ ] Unit tests

### Medium Priority
- [ ] Queue system for multiple downloads
- [ ] Better error handling classes
- [ ] Download history feature
- [ ] Settings/preferences page

### Low Priority
- [ ] Docker support
- [ ] TypeScript migration
- [ ] E2E tests
- [ ] API documentation (OpenAPI/Swagger)

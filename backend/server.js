const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');  // Add regular fs for streaming
const { spawn } = require('child_process');

const app = express();

// Initialize yt-dlp without options first
const ytDlp = new YTDlpWrap();

// Define FFmpeg paths
const FFMPEG_PATH = '/opt/homebrew/bin/ffmpeg';
const FFPROBE_PATH = '/opt/homebrew/bin/ffprobe';

app.use(cors());
app.use(bodyParser.json());

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
fs.mkdir(tempDir, { recursive: true })
    .then(() => console.log('✅ Temp directory created/verified:', tempDir))
    .catch(err => console.error('❌ Error creating temp directory:', err));

app.post('/convert', async (req, res) => {
    console.log('📥 Received conversion request');
    const { url } = req.body;
    
    if (!url) {
        console.log('❌ No URL provided in request');
        return res.status(400).json({ error: 'URL is required' });
    }

    console.log('🔗 Processing URL:', url);

    try {
        // Get video info first
        console.log('📋 Fetching video info...');
        const info = await ytDlp.getVideoInfo(url);
        console.log('✅ Video info retrieved:', {
            title: info.title,
            duration: info.duration,
            format: info.format
        });

        const videoTitle = info.title || 'download';
        const safeTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeTitle}-${Date.now()}.mp3`;
        const outputFile = path.join(tempDir, fileName);

        console.log('🎵 Starting download and conversion...');
        console.log('📂 Output file:', outputFile);

        // Use spawn directly for better control and error logging
        return new Promise((resolve, reject) => {
            let responded = false;
            const ytDlpProcess = spawn('yt-dlp', [
                '-x',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', outputFile,
                '--ffmpeg-location', FFMPEG_PATH,
                '--no-keep-video',
                '--force-overwrites',
                '--no-playlist',
                url
            ]);

            ytDlpProcess.stdout.on('data', (data) => {
                console.log('yt-dlp output:', data.toString());
            });

            let errorBuffer = '';
            ytDlpProcess.stderr.on('data', (data) => {
                const errorMessage = data.toString();
                errorBuffer += errorMessage;
                console.error('yt-dlp error:', errorMessage);
            });

            ytDlpProcess.on('close', async (code) => {
                if (responded) return;
                if (code === 0) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const stats = await fs.stat(outputFile);
                        console.log('✅ File created successfully:', {
                            size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                            path: outputFile
                        });
                        const downloadUrl = `http://localhost:4000/download/${fileName}`;
                        console.log('🔗 Download URL created:', downloadUrl);
                        responded = true;
                        res.json({
                            success: true,
                            downloadUrl,
                            title: videoTitle
                        });
                        resolve();
                    } catch (error) {
                        console.error('❌ Error verifying file:', error);
                        responded = true;
                        res.status(500).json({ success: false, error: 'File verification failed.' });
                        reject(error);
                    }
                } else {
                    let errorMsg = 'An error occurred during conversion.';
                    if (errorBuffer.includes('Signature extraction failed')) {
                        errorMsg = 'Signature extraction failed. This is often caused by an outdated yt-dlp version or changes on YouTube. Please update yt-dlp to the latest version. If the problem persists, try again later or report the issue.';
                        res.status(400).json({ success: false, error: errorMsg, details: errorBuffer });
                    } else if (errorBuffer.includes('Requested format is not available')) {
                        errorMsg = 'Requested format is not available. This may be due to YouTube restrictions or an outdated yt-dlp version. Try updating yt-dlp or use a different video.';
                        res.status(400).json({ success: false, error: errorMsg, details: errorBuffer });
                    } else {
                        res.status(500).json({ success: false, error: errorMsg, details: errorBuffer });
                    }
                    responded = true;
                    reject(new Error(errorMsg));
                }
            });

            ytDlpProcess.on('error', (error) => {
                if (responded) return;
                console.error('❌ Process error:', error);
                responded = true;
                res.status(500).json({ success: false, error: 'Failed to start yt-dlp process.' });
                reject(error);
            });
        });

    } catch (error) {
        console.error('❌ Conversion error:', {
            message: error.message,
            stack: error.stack,
            command: error.command,
            code: error.code
        });

        res.status(500).json({
            success: false,
            error: 'Conversion failed',
            details: error.message
        });
    }
});

app.get('/download/:filename', async (req, res) => {
    const filePath = path.join(tempDir, req.params.filename);
    console.log('📥 Download requested:', filePath);

    try {
        await fs.access(filePath);
        const stats = await fs.stat(filePath);
        console.log('📂 File stats:', {
            size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
            created: stats.birthtime
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
        
        // Use fsSync.createReadStream instead of fs.createReadStream
        const fileStream = fsSync.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('end', () => {
            console.log('✅ File streamed successfully:', req.params.filename);
            fs.unlink(filePath)
                .then(() => console.log('🗑️ Temp file deleted:', req.params.filename))
                .catch(err => console.error('❌ Error deleting temp file:', err));
        });

        fileStream.on('error', (error) => {
            console.error('❌ Streaming error:', error);
            res.status(500).end();
        });

    } catch (error) {
        console.error('❌ Download error:', {
            filename: req.params.filename,
            error: error.message
        });
        res.status(404).json({ error: 'File not found' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Temp directory: ${tempDir}`);
});

// Log unhandled errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('💥 Unhandled Rejection:', error);
});
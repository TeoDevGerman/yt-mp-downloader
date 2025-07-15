const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');

// Util: clean filenames
const sanitizeFilename = (name) =>
    name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_').trim();

async function downloadYouTubeMP3(url, io, socketId) {
    function emitProgress(message) {
        if (io && socketId) {
            io.to(socketId).emit('download-progress', { message });
        }
    }
    emitProgress('Downloading metadata...');
    const infoRaw = execSync(`yt-dlp -j ${url}`);
    const info = JSON.parse(infoRaw.toString());

    const title = info.title || 'untitled';
    const uploader = info.uploader || 'unknown';
    const thumbnailUrl = info.thumbnail;

    const safeTitle = sanitizeFilename(title);
    const baseFilename = `${safeTitle}_${uuidv4().slice(0, 8)}`;

    const audioPath = path.join('downloads', `${baseFilename}_raw.mp3`);
    const finalPath = path.join('downloads', `${baseFilename}.mp3`);
    const thumbnailPath = path.join('downloads', `${baseFilename}_thumb.jpg`);

    // Ensure directory exists
    fs.mkdirSync('downloads', { recursive: true });

    emitProgress('Downloading audio...');
    execSync(`yt-dlp -x --audio-format mp3 -o "${audioPath}" ${url}`);

    emitProgress('Downloading thumbnail...');
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(thumbnailPath, response.data);

    emitProgress('Embedding metadata...');
    const ffmpegCmd = [
        'ffmpeg',
        `-i "${audioPath}"`,
        `-i "${thumbnailPath}"`,
        '-map 0:0',
        '-map 1:0',
        `-metadata title="${title}"`,
        `-metadata artist="${uploader}"`,
        '-metadata album="YouTube Downloads"',
        '-id3v2_version 3',
        '-write_id3v1 1',
        '-y', // Overwrite output if exists
        `"${finalPath}"`
    ].join(' ');
    try {
        execSync(ffmpegCmd, { stdio: 'ignore' });
    } catch (err) {
        emitProgress('ffmpeg error!');
        console.error('ffmpeg error:', err);
        throw err;
    }

    // Step 4: Clean up
    fs.unlinkSync(audioPath);
    fs.unlinkSync(thumbnailPath);

    emitProgress('✅ MP3 ready!');
    console.log(safeTitle);
    return finalPath;
}

module.exports = { downloadYouTubeMP3 };

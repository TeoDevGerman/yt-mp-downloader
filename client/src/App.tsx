import { useState, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { parseBlob } from 'music-metadata';
import './App.css';

const BACKEND_URL = 'http://localhost:3001';

function App() {
  const [url, setUrl] = useState('');
  const [metadata, setMetaData] = useState(new Map())
  const [progress, setProgress] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  async function readMetadata(blob: Blob) {
    try {
      const res = await parseBlob(blob);

      setMetaData(map => new Map(map.set('Title', res.common.title)))
      setMetaData(map => new Map(map.set('Artist', res.common.artist)))
      setMetaData(map => new Map(map.set('Album', res.common.album)))
      setMetaData(map => new Map(map.set('Picture', res.common.picture?.[0])))

    } catch (err) {
      console.error('Error reading metadata:', err);
    }
  }

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setProgress([]);
    setDownloading(true);
    setDownloadUrl(null);

    // Connect to socket.io
    if (!socketRef.current) {
      socketRef.current = io(BACKEND_URL);
    }
    const socket = socketRef.current;

    socket.on('download-progress', (data) => {
      setProgress((prev) => [...prev, data.message]);
    });

    socket.once('connect', async () => {
      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/download`,
          { url, socketId: socket.id },
          { responseType: 'blob' }
        );

        // Create a download link
        const blob = new Blob([response.data], { type: 'audio/mp3' });
        await readMetadata(blob);
        const link = window.URL.createObjectURL(blob);
        setDownloadUrl(link);
        setProgress((prev) => [...prev, 'Download complete!']);
      } catch (err) {
        setProgress((prev) => [...prev, 'Download failed.']);
      } finally {
        setDownloading(false);
        socket.disconnect();
        socketRef.current = null;
      }
    });
  };
  return (
    <div className="container">
      <h1>YouTube MP Downloader</h1>
      <form className='submit-form' onSubmit={handleDownload}>
        <input
          className='url-input'
          type="text"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={downloading}
        />
        <button type="submit" disabled={downloading || !url}>
          {downloading ? 'Downloading...' : 'Download MP3'}
        </button>
      </form>
      <div className="progress">
        {progress.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
      {downloadUrl && (
        <a href={downloadUrl} download={metadata.get('Title') + ".mp3"} className="download-link">
          Click here to download your MP3
        </a>
      )}
    </div>
  );
}

export default App;

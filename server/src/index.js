const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { downloadYouTubeMP3 } = require('./download.js')
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // Change this in production!

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(cors());
app.use(express.json());

const PORT = 3001;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ytmp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/api/download', async (req, res) => {
    try {
        const { url, socketId } = req.body;
        if (!url) return res.status(400).json({ error: 'No URL provided' });

        // Pass io and socketId to download function for progress updates
        const filePath = await downloadYouTubeMP3(url, io, socketId);
        res.download(filePath); // Sends file to user

        await sleep(1000);

        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error("Failed to delete file:", unlinkErr);
            } else {
                console.log("Deleted file:", filePath);
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed });
        await user.save();
        res.json({ message: 'User registered' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

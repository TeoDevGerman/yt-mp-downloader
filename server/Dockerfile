# Use official Node.js base image with Debian (includes npm & node)
FROM node:20-bookworm

# Install system dependencies: ffmpeg, Python, pip, venv
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip python3-venv && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create and activate Python virtual environment
RUN python3 -m venv /venv && \
    /venv/bin/pip install --upgrade pip yt-dlp

# Add venv to PATH so yt-dlp is globally available
ENV PATH="/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy your Node app into the container
COPY . .

# Install Node dependencies
RUN npm install

# Expose the port your app runs on (adjust if different)
EXPOSE 3000

# Start the Node.js app
CMD ["npm", "start"]

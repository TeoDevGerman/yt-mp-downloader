# Use a lightweight Node.js image
FROM node:20-slim

# Install ffmpeg and Python (for yt-dlp)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install -U yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy package.json and install dependencies first (for caching)
COPY package*.json ./

RUN npm install

# Now copy the rest of the server files
COPY . .

# Expose the port your app runs on (adjust if different)
EXPOSE 3001

# Start the server
CMD ["node", "src/index.js"]

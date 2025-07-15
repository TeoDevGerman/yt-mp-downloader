FROM debian:bookworm

# Install ffmpeg, python3, python3-pip, and python3-venv
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip python3-venv && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create a virtual environment at /venv
RUN python3 -m venv /venv

# Upgrade pip inside the venv and install yt-dlp
RUN /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install yt-dlp

# Add virtual environment's bin directory to PATH
ENV PATH="/venv/bin:$PATH"

# Optional: Confirm yt-dlp installation
RUN yt-dlp --version

# Default command (optional)
CMD ["yt-dlp", "--help"]

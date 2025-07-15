#!/usr/bin/env bash
set -e

echo "Installing yt-dlp..."
pip install -U yt-dlp

echo "Installing ffmpeg..."
apt-get update
apt-get install -y ffmpeg

yt-dlp --version
ffmpeg -version

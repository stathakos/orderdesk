#!/bin/bash
echo "🍕 Starting Restaurant App Backend..."
cd "$(dirname "$0")/backend"

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt --quiet

# Start backend on all interfaces so local network can access it
echo "Backend starting on http://0.0.0.0:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000

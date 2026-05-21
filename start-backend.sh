#!/bin/bash
echo "🍕 Starting OrderDesk Backend..."
cd "$(dirname "$0")/backend"

# Activate venv — works on both Linux and Windows
if [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate  # Windows
else
    source venv/bin/activate  # Linux/Mac
fi

# Start backend
echo "Backend starting on http://0.0.0.0:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000

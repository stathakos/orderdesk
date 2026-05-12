#!/bin/bash
echo "🍕 Starting OrderDesk Backend..."
cd "$(dirname "$0")/backend"

# Activate venv
source venv/bin/activate

# Start backend
echo "Backend starting on http://0.0.0.0:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000

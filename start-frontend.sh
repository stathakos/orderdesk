#!/bin/bash
echo "🍕 Starting Restaurant App Frontend..."
cd "$(dirname "$0")/frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing node modules..."
    npm install
fi

# Build and preview on all interfaces
echo "Building frontend..."
npm run build

echo "Frontend starting on http://0.0.0.0:4173"
npm run preview -- --host 0.0.0.0 --port 4173

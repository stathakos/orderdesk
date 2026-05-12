#!/bin/bash
echo "🍕 Starting OrderDesk Frontend..."
cd "$(dirname "$0")/frontend"

# Build if dist doesn't exist OR if source files are newer than dist
if [ ! -d "dist" ] || [ "$(find src -newer dist -name '*.jsx' -o -name '*.js' -o -name '*.css' | head -1)" != "" ]; then
    echo "Changes detected — rebuilding frontend..."
    npm run build
else
    echo "No changes detected — skipping build..."
fi

echo "Frontend starting on http://0.0.0.0:4173"
npm run preview -- --host 0.0.0.0 --port 4173

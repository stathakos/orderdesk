#!/bin/bash
echo "================================================"
echo "  🍕 OrderDesk — Starting..."
echo "================================================"
echo ""

cd "$(dirname "$0")"

# ------------------------------------
# Auto-update check
# ------------------------------------
echo "Checking for updates..."

# Check if we have internet and can reach GitHub
if git fetch origin main --quiet 2>/dev/null; then
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "🔄 New update found! Pulling changes..."
        git pull origin main --quiet
        echo "✅ Updated successfully!"
        
        # Reinstall backend dependencies if requirements changed
        if git diff HEAD@{1} HEAD --name-only | grep -q "requirements.txt"; then
            echo "📦 Backend dependencies changed — reinstalling..."
            cd backend
            source venv/bin/activate
            pip install -r requirements.txt --quiet
            cd ..
        fi

        # Rebuild frontend if source files changed
        if git diff HEAD@{1} HEAD --name-only | grep -q "^frontend/"; then
            echo "🔨 Frontend changed — rebuilding..."
            cd frontend
            npm install --silent
            npm run build
            cd ..
        fi

        echo "✅ All updates applied!"
    else
        echo "✅ Already up to date."
    fi
else
    echo "⚠️  No internet connection — skipping update check."
fi

echo ""

# ------------------------------------
# Get local IP
# ------------------------------------
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "================================================"
echo "  App will be available at:"
echo "  http://$LOCAL_IP:4173"
echo "  Share this address with devices on your WiFi"
echo "================================================"
echo ""

# Start backend in background
bash "$(dirname "$0")/start-backend.sh" &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
bash "$(dirname "$0")/start-frontend.sh"

# When frontend stops, stop backend too
kill $BACKEND_PID

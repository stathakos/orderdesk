#!/bin/bash
echo "🍕 Starting Restaurant App..."

# Get local IP
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

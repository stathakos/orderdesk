#!/bin/bash
echo "================================================"
echo "  OrderDesk — Setup Script (Linux/Mac)"
echo "================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install it from python.org"
    exit 1
fi
echo "✅ Python3 found: $(python3 --version)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it from nodejs.org"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Please install it."
    exit 1
fi
echo "✅ pip3 found"

echo ""
echo "Setting up backend..."
cd "$(dirname "$0")/backend"

# Create venv if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install
source venv/bin/activate
pip install -r requirements.txt --quiet
echo "✅ Backend dependencies installed"

echo ""
echo "Setting up frontend..."
cd "../frontend"
npm install --silent
echo "✅ Frontend dependencies installed"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    # Try Linux way first, then Windows way
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$LOCAL_IP" ]; then
        # Windows fallback
        LOCAL_IP=$(ipconfig 2>/dev/null | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
    fi
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
    echo "VITE_API_URL=http://$LOCAL_IP:8000" > .env
    echo "✅ Created .env with IP: $LOCAL_IP"
else
    echo "✅ .env already exists"
fi

echo ""
npm run build
echo "✅ Frontend built"

echo ""
echo "================================================"
echo "  Setup complete!"
echo "  Run ./start.sh to launch OrderDesk"
echo "================================================"

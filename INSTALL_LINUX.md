# OrderDesk — Linux Installation Guide

---

## Prerequisites

### STEP 1 — Install Git
```bash
sudo apt install git
```

### STEP 2 — Install Python 3.12
```bash
sudo apt install python3 python3-pip python3-venv
```

Verify:
```bash
python3 --version
# Should say: Python 3.12.x
```

### STEP 3 — Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
```

Verify:
```bash
node --version
# Should say: v20.x.x
```

---

## Installation

### STEP 4 — Clone the project
```bash
cd ~/Desktop
git clone https://github.com/stathakos/orderdesk.git
cd orderdesk
```

### STEP 5 — Run setup
```bash
chmod +x setup.sh start.sh start-backend.sh start-frontend.sh
./setup.sh
```

The script will:
- Create Python virtual environment
- Install backend dependencies
- Generate backend `.env` with database URL and secret key
- Install frontend dependencies
- Auto-detect your local IP and create frontend `.env`
- Build the frontend

### STEP 6 — Start the app
```bash
./start.sh
```

The app will be available at the IP address shown in the terminal.
Share it with any device on the same WiFi network.

---

## Troubleshooting

**Permission denied running scripts**
```bash
chmod +x setup.sh start.sh start-backend.sh start-frontend.sh
```

**Backend crashes on startup**
```bash
cat backend/.env
# Should have DATABASE_URL and SECRET_KEY
# If missing:
cd backend
SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
echo "DATABASE_URL=sqlite:///./restaurant.db" > .env
echo "SECRET_KEY=$SECRET" >> .env
```

**App not accessible from other devices**
```bash
cat frontend/.env
# Should say: VITE_API_URL=http://YOUR_IP:8000
# If wrong, fix it:
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "VITE_API_URL=http://$LOCAL_IP:8000" > frontend/.env
cd frontend && npm run build
```

**Port already in use**
```bash
# Kill whatever is using port 8000 or 4173
sudo fuser -k 8000/tcp
sudo fuser -k 4173/tcp
```

---

## First Login
- Open the app in your browser at the IP shown in terminal
- Username: **admin**
- Password: **admin123**
- ⚠️ Change the password immediately after first login!


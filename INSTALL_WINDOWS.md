# OrderDesk — Windows Installation Guide

---

## Prerequisites

### STEP 1 — Install Git
- Go to https://git-scm.com/download/win
- Download and install with all default options
- This also installs **Git Bash** — use it for all commands below (not CMD, not PowerShell)

### STEP 2 — Install Python 3.12 ⚠️
> **Important:** Do NOT install Python 3.13 or 3.14 — use exactly 3.12

- Go to https://www.python.org/downloads/release/python-31210/
- Scroll down to **Files** → download **Windows installer (64-bit)**
- During install:
  - ✅ Check **"Add Python to PATH"**
  - Click **Customize installation** → **Next**
  - ✅ Check **"Add Python to environment variables"**
  - Click **Install**
  - ✅ Click **"Disable path length limit"** at the end

Verify in Git Bash:
```bash
python --version
# Should say: Python 3.12.x
```

> If it still shows 3.14 or "not found":
> - Open Windows Settings → search "App execution aliases"
> - Turn OFF python.exe and python3.exe
> - Open a new Git Bash window and try again

### STEP 3 — Install Node.js
- Go to https://nodejs.org
- Download the **LTS** version
- Install with all default options

Verify:
```bash
node --version
# Should say: v20.x.x or similar
```

---

## Installation

### STEP 4 — Clone the project
Open **Git Bash** and run:
```bash
cd ~/Desktop
git clone https://github.com/stathakos/orderdesk.git
cd orderdesk
```

### STEP 5 — Run setup
Double-click **`setup.bat`** or run in Git Bash:
```bash
./setup.bat
```

When asked for your IP address:
- Open a new Git Bash window and run:
```bash
ipconfig
```
- Look for **IPv4 Address** under your WiFi adapter (e.g. `192.168.1.x`)
- Enter that IP when prompted

### STEP 6 — Start the app
Double-click **`start.bat`** or run:
```bash
./start.bat
```

Two windows will open — one for the backend, one is minimized for the frontend.

The app will be available at the IP address shown in the terminal.

---

## Troubleshooting

**`python not found` or wrong version**
- Uninstall all Python versions from Control Panel
- Disable Python aliases in Settings → App execution aliases
- Reinstall Python 3.12 from the link above

**`uvicorn not found`**
```bash
cd ~/Desktop/orderdesk/backend
rm -rf venv
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
```

**`vite is not recognized`**
```bash
cd ~/Desktop/orderdesk/frontend
npm install
npm run build
```

**App not accessible from other devices**
```bash
# Check your .env file
cat ~/Desktop/orderdesk/frontend/.env
# Should say: VITE_API_URL=http://YOUR_IP:8000
# If it says localhost, fix it:
echo 'VITE_API_URL=http://YOUR_IP:8000' > ~/Desktop/orderdesk/frontend/.env
cd ~/Desktop/orderdesk/frontend && npm run build
```

**Backend crashes on startup**
```bash
# Check if backend .env exists
cat ~/Desktop/orderdesk/backend/.env
# Should have DATABASE_URL and SECRET_KEY
# If missing, create it:
echo 'DATABASE_URL=sqlite:///./restaurant.db' > ~/Desktop/orderdesk/backend/.env
```

---

## First Login
- Open the app in your browser
- Username: **admin**
- Password: **admin123**
- ⚠️ Change the password immediately after first login!


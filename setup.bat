@echo off
echo ================================================
echo   OrderDesk - Setup Script (Windows)
echo ================================================
echo.

REM Check Python
python --version > nul 2>&1
if errorlevel 1 (
    echo X Python not found. Please install from python.org
    pause
    exit /b 1
)
echo [OK] Python found
for /f "tokens=*" %%i in ('python --version') do echo     %%i

REM Check Node
node --version > nul 2>&1
if errorlevel 1 (
    echo X Node.js not found. Please install from nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found
for /f "tokens=*" %%i in ('node --version') do echo     %%i

echo.
echo Setting up backend...
cd /d "%~dp0backend"

REM Create venv if needed
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate and install
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
echo [OK] Backend dependencies installed

echo.
echo Setting up frontend...
cd /d "%~dp0frontend"
call npm install --silent
echo [OK] Frontend dependencies installed

REM Create .env if it doesn't exist
if not exist ".env" (
    echo.
    echo IMPORTANT: You need to create a .env file in the frontend folder.
    echo Create a file called .env with this content:
    echo VITE_API_URL=http://YOUR_PC_IP:8000
    echo.
    echo To find your IP: open CMD and type 'ipconfig'
    echo Look for 'IPv4 Address' under your network adapter
    echo.
) else (
    echo [OK] .env already exists
)

echo.
call npm run build
echo [OK] Frontend built

echo.
echo ================================================
echo   Setup complete!
echo   Run start.bat to launch OrderDesk
echo ================================================
pause

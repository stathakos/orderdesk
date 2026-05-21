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

REM Add this after "Backend dependencies installed"
if not exist ".env" (
    echo Creating backend .env...
    for /f %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set SECRET=%%i
    echo DATABASE_URL=sqlite:///./restaurant.db> .env
    echo SECRET_KEY=%SECRET%>> .env
    echo [OK] Backend .env created with secret key
) else (
    echo [OK] Backend .env already exists
)

echo.
echo Setting up frontend...
cd /d "%~dp0frontend"
call npm install --silent
echo [OK] Frontend dependencies installed

REM Create .env if it doesn't exist
if not exist ".env" (
    echo.
    set /p USER_IP="Enter your local IP address (e.g. 192.168.1.36): "
    echo VITE_API_URL=http://%USER_IP%:8000> .env
    echo [OK] Created .env with IP: %USER_IP%
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

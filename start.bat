@echo off
echo ================================================
echo   OrderDesk - Starting...
echo ================================================
echo.

cd /d "%~dp0"

REM Auto-update check
echo Checking for updates...
git fetch origin main --quiet 2>nul
if errorlevel 1 (
    echo [WARNING] No internet connection - skipping update check.
    goto START
)

for /f %%i in ('git rev-parse HEAD') do set LOCAL=%%i
for /f %%i in ('git rev-parse origin/main') do set REMOTE=%%i

if "%LOCAL%"=="%REMOTE%" (
    echo [OK] Already up to date.
    goto START
)

echo [UPDATE] New update found! Pulling changes...
git pull origin main --quiet
echo [OK] Updated successfully!

REM Check if requirements changed
git diff HEAD@{1} HEAD --name-only | findstr "requirements.txt" >nul
if not errorlevel 1 (
    echo [UPDATE] Backend dependencies changed - reinstalling...
    cd backend
    call venv\Scripts\activate.bat
    pip install -r requirements.txt --quiet
    cd ..
)

REM Check if frontend changed
git diff HEAD@{1} HEAD --name-only | findstr "^frontend/" >nul
if not errorlevel 1 (
    echo [UPDATE] Frontend changed - rebuilding...
    cd frontend
    call npm install --silent
    call npm run build
    cd ..
)

echo [OK] All updates applied!

:START
echo.

REM Start backend in a new window
start "OrderDesk Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in a new window  
start "OrderDesk Frontend" cmd /k "cd /d "%~dp0frontend" && npm run preview -- --host 0.0.0.0 --port 4173"

echo.
echo Both services starting in separate windows.
echo.
for /f %%i in ('powershell -command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex (Get-NetRoute -DestinationPrefix 0.0.0.0/0).ifIndex).IPAddress"') do set LOCAL_IP=%%i
echo App available at: http://%LOCAL_IP%:4173
echo.
pause

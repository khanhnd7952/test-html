@echo off
echo ========================================
echo   AdData JSON Serializer Tool v2.0
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Initializing database...
call npm run init-db

if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize database
    pause
    exit /b 1
)

echo.
echo Starting the application...
echo.
echo ========================================
echo   Server will start at http://localhost:3000
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

call npm start

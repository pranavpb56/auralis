@echo off
echo.
echo  ========================================
echo   Auralis Setup
echo  ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed!
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)

echo  [1/4] Node.js found
node --version

REM Create .env if missing
if not exist ".env" (
    copy .env.example .env >nul
    echo  [2/4] Created .env file
    echo.
    echo  IMPORTANT: Open .env and add your GROQ_API_KEY
    echo  Get a free key at: https://console.groq.com
    echo.
) else (
    echo  [2/4] .env already exists
)

REM Install backend deps
echo  [3/4] Installing backend packages...
cd backend
call npm install
cd ..

REM Install frontend deps
echo  [4/4] Installing frontend packages...
cd frontend
call npm install
cd ..

echo.
echo  ========================================
echo   Setup complete!
echo  ========================================
echo.
echo  To start Auralis:
echo    node start.js
echo.
echo  Then open:  http://localhost:3000
echo.
pause

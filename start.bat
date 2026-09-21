@echo off
title iSchool B2B Workshop Platform
color 0A

echo.
echo  ====================================================
echo  🚀  iSchool B2B Onboarding Workshop Platform
echo  ====================================================
echo.

:: Check Node is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: ── Kill any stale processes on our ports ────────────────────────────────────
echo  Clearing ports 3001 and 5173...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    echo    Killing PID %%a on port 3001
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo    Killing PID %%a on port 5173
    taskkill /PID %%a /F >nul 2>&1
)

:: Brief pause so OS releases the ports
timeout /t 1 /nobreak >nul

echo.
echo  Starting Backend (port 3001) and Frontend (port 5173)...
echo  Press CTRL+C twice to stop both servers.
echo.

npm run dev

pause

@echo off
title City Rush Car Simulator 3D - Local Server
color 0A

echo ==========================================
echo        City Rush Car Simulator 3D - Game Launcher
echo ==========================================
echo.

cd /d "%~dp0"

echo Starting local game server...
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python was not found.
    echo.
    echo Install Python and make sure "Add Python to PATH" is enabled.
    pause
    exit /b 1
)

echo Server running at:
echo http://localhost:8000
echo.

start "" "http://localhost:8000"

python -m http.server 8000

pause
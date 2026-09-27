@echo off
cd /d "%~dp0"

echo Installing packages, please wait...
call npm install

echo.
echo Starting frontend...
echo A link like http://localhost:5173 will appear below - Ctrl+Click it.
echo Keep this window open while demoing.
echo.
call npm run dev

pause

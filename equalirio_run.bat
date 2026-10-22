@echo off
title EQUALIRIO Development Server
cd /d "%~dp0"

echo Starting EQUALIRIO...
echo.

call npm run dev

pause
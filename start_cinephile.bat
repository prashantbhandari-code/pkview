@echo off
title pkview Local Server
echo Starting pkview local server...
echo.
echo Website will be available at:
echo http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000 --directory "%~dp0"
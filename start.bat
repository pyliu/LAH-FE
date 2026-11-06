@echo off
title LAH-FE - PM2 Start

set "LOCAL_NODE=%~dp0node"

if exist "%LOCAL_NODE%\node.exe" (
    set "TARGET_NODE=%LOCAL_NODE%"
) else if exist "C:\AppServ\node\node.exe" (
    set "TARGET_NODE=C:\AppServ\node"
) else (
    echo [ERROR] Node.js executable not found!
    echo Please make sure node.js is in %~dp0node or C:\AppServ\node
    pause
    exit /b 1
)

set "PATH=%TARGET_NODE%;%PATH%"
cd /d "%~dp0"

echo [INFO] Loaded Node.js:
call "%TARGET_NODE%\node.exe" -v
echo [INFO] Starting services via PM2 (ecosystem.config.js)...
call pm2 start ecosystem.config.js

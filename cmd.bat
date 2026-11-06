@echo off
title LAH-FE Node.js 16 Sandbox

set "LOCAL_NODE=%~dp0node"

if exist "%LOCAL_NODE%\node.exe" (
    set "TARGET_NODE=%LOCAL_NODE%"
) else if exist "C:\AppServ\node\node.exe" (
    echo [WARN] Local node folder not found. Falling back to C:\AppServ\node
    set "TARGET_NODE=C:\AppServ\node"
) else (
    echo [ERROR] Node.js executable not found!
    echo Please make sure node.js is in %~dp0node or C:\AppServ\node
    pause
    exit /b 1
)

set "PATH=%TARGET_NODE%;%PATH%"
cd /d "%~dp0"

echo ========================================================
echo  LAH-FE Node.js 16 Sandbox (Portable Environment)
echo ========================================================
echo  Node Path: %TARGET_NODE%
echo  Node.js:
call "%TARGET_NODE%\node.exe" -v
echo  npm:
call "%TARGET_NODE%\npm.cmd" -v
if exist "%TARGET_NODE%\yarn.cmd" (
    echo  yarn:
    call "%TARGET_NODE%\yarn.cmd" -v
)
echo ========================================================
echo  Local Node.js is prioritized in PATH (Global unaffected).
echo  You can run: yarn dev, yarn build, npm, node, etc.
echo ========================================================
echo.

cmd /k

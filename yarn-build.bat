@echo off
title LAH-FE 靜態網站產製 (yarn generate)
cd /d "%~dp0"

echo ========================================================
echo  LAH-FE 靜態網站產製工具 (Static SPA Build)
echo ========================================================
echo.

set "LOCAL_NODE=%~dp0node"
set "APPSERV_NODE=C:\AppServ\node"

if exist "%LOCAL_NODE%\node.exe" (
    echo [環境] 偵測到本地目錄可攜式 Node.js: %LOCAL_NODE%
    set "PATH=%LOCAL_NODE%;%PATH%"
) else if exist "%APPSERV_NODE%\node.exe" (
    echo [環境] 偵測到 AppServ 目錄可攜式 Node.js: %APPSERV_NODE%
    set "PATH=%APPSERV_NODE%;%PATH%"
) else (
    where node >nul 2>&1
    if errorlevel 1 (
        echo [錯誤] 系統中未找到 Node.js！
        echo 請確認已安裝 Node.js，或將可攜式 Node.js 放至:
        echo   1. %LOCAL_NODE%
        echo   2. %APPSERV_NODE%
        echo.
        pause
        exit /b 1
    )
    echo [環境] 使用系統全域 Node.js
)

echo [資訊] 目前 Node.js 版本:
node -v
if errorlevel 1 (
    echo [錯誤] 無法執行 node 指令！
    pause
    exit /b 1
)

where yarn >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 系統中未找到 yarn 命令列工具！
    echo 請先執行 npm install -g yarn 進行安裝。
    pause
    exit /b 1
)

echo [資訊] 目前 Yarn 版本:
call yarn -v
echo.

set "NODE_ENV=production"

:: Node 17+ (如 Node v18/v20/v22/v26) 需開啟 OpenSSL legacy provider 以支援 Webpack 4 md4 雜湊
if defined NODE_OPTIONS (
    echo %NODE_OPTIONS% | findstr /i "openssl-legacy-provider" >nul
    if errorlevel 1 (
        set "NODE_OPTIONS=%NODE_OPTIONS% --openssl-legacy-provider"
    )
) else (
    set "NODE_OPTIONS=--openssl-legacy-provider"
)

echo [設定] NODE_ENV=%NODE_ENV%
echo [設定] NODE_OPTIONS=%NODE_OPTIONS%
echo.
echo --------------------------------------------------------
echo 正在產製靜態網頁 (yarn generate)... 請稍候
echo --------------------------------------------------------
echo.

call yarn generate
if errorlevel 1 (
    echo.
    echo ========================================================
    echo [失敗] yarn generate 產製過程中斷或發生錯誤！
    echo ========================================================
    pause
    exit /b 1
)

if not exist "%~dp0dist\index.html" (
    echo.
    echo ========================================================
    echo [警告] 編譯完成但未找到 dist\index.html 檔案！
    echo ========================================================
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [成功] 靜態網頁產製完成！
echo 產物目錄：%~dp0dist
echo.
echo 您可以將 dist 資料夾下的內容複製至 Apache 監管目錄。
echo ========================================================
echo.
echo 按任意鍵將為您在檔案總管開啟 dist 資料夾...
pause >nul

start "" explorer "%~dp0dist"
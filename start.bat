@echo off
set "PATH=C:\AppServ\node;%PATH%"
call pm2 start ecosystem.config.js

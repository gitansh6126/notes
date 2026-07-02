@echo off

cd /d "%~dp0"

git fetch
git status
git pull

IF ERRORLEVEL 1 (
    echo Fix Git conflicts first.
    pause
    exit /b
)

start "" code .
timeout /t 2 >nul
start "" http://127.0.0.1:8080
start "" cmd /k "live-server"
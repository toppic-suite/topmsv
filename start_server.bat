@echo off
rem Start the TopMSV server on Windows (double-click, or run from a terminal).
rem
rem   start_server.bat                 start at http://localhost:3000
rem   start_server.bat --view-only     read-only server (no upload / delete)
rem
rem Set PORT and DATA_DIR before running to change the port or the dataset
rem directory, e.g. in a terminal:
rem   set PORT=8080
rem   set DATA_DIR=D:\topmsv_data
rem   start_server.bat
rem
rem The first run installs the dependencies and builds the browser scripts.
rem Requires Node.js 24 or newer (https://nodejs.org).

setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 24 or newer from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist "public\common\js\home.js" (
  echo Building the browser scripts...
  call npm run build:client
  if errorlevel 1 (
    echo The build failed.
    pause
    exit /b 1
  )
)

if "%PORT%"=="" set PORT=3000
echo Starting TopMSV at http://localhost:%PORT% (press Ctrl+C to stop)
call npm start -- %*

endlocal

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
rem The first run installs the dependencies, builds the browser scripts and
rem downloads the sqlite-zstd extension, which reads compressed sqlite files.
rem Requires Node.js 24 or newer (https://nodejs.org). A bundled copy in the
rem "node" folder next to this script is used when present.

setlocal
cd /d "%~dp0"

rem Use the bundled Node.js in the "node" folder if it exists.
set "PATH=%~dp0node;%PATH%"

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

rem The sqlite-zstd extension (unless SQLITE_ZSTD_EXTENSION names one). A
rem failed download only warns: uncompressed sqlite files do not need it.
if "%SQLITE_ZSTD_EXTENSION%"=="" if not exist "ext\sqlite_zstd\sqlite_zstd.dll" (
  echo Downloading the sqlite-zstd extension...
  call npm run fetch-sqlite-zstd
  if errorlevel 1 (
    echo The sqlite-zstd extension could not be downloaded: compressed sqlite files cannot be read.
  )
)

rem The sqlite-zstd DLL needs VCRUNTIME140.dll of the Microsoft Visual C++
rem Redistributable (x64), which Windows does not include. Only warn: without
rem it only compressed sqlite files cannot be read.
if "%SQLITE_ZSTD_EXTENSION%"=="" if not exist "%SystemRoot%\System32\vcruntime140.dll" (
  echo WARNING: the Microsoft Visual C++ Redistributable x64 is not installed, so compressed sqlite files cannot be read.
  echo Install it from https://aka.ms/vs/17/release/vc_redist.x64.exe and start TopMSV again.
)

if "%PORT%"=="" set PORT=3000
echo Starting TopMSV at http://localhost:%PORT% (press Ctrl+C to stop)
call npm start -- %*

endlocal

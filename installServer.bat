@echo off
set PATH=%PATH%;%CD%
call npm install
cd public/resources/topview
call npm install
echo .
echo . 
echo TopMSV installation finished. 
echo Run startServer.bat to start TopMSV.
pause
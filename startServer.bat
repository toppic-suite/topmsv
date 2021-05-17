@ECHO OFF
taskkill /f /t /fi "WINDOWTITLE eq TopMSV" > NUL
init.vbs
ECHO TopMSV
ECHO Please wait.... Chrome browser will open when the server is ready. It may take a few minutes.
pause
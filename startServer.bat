@ECHO OFF
taskkill /f /t /fi "WINDOWTITLE eq TopMSV" > NUL
init.vbs
ECHO TopMSV
ECHO Please wait.... Chrome browser will open when the server is ready. It may take a few minutes.
ECHO .
ECHO If Chrome browser is still not opened after waiting, please open Chrome browser and enter http://localhost:8443 in the address bar to get access to the TopMSV server.
ECHO .
pause
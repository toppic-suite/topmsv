#!/bin/sh
if pgrep -x TopMSV > /dev/null
  then
	kill $(pgrep npm) > /dev/null
	kill $(pgrep TopMSV) > /dev/null
	npm start > /dev/null &
  else
	npm start > /dev/null &
fi
echo Please wait.... Chrome browser will open when the server is ready. It may take a few minutes.
echo .
echo If Chrome browser is still not opened after waiting, please open Chrome browser and enter http://localhost:8443 in the address bar to get access to the TopMSV server.
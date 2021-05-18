#!/bin/sh
if pgrep -x TopMSV > /dev/null
  then
	kill $(pgrep npm) > /dev/null
	kill $(pgrep TopMSV) > /dev/null
	npm start > /dev/null &
  else
	npm start > /dev/null &
fi
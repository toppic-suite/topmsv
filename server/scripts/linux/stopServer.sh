#!/bin/sh
kill $(pgrep npm) > /dev/null &
kill $(pgrep TopMSV) > /dev/null &
echo "The TopMSV server is stopped!"

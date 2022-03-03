#!/bin/sh
kill $(pgrep TopMSV) > /dev/null &
echo "The TopMSV server is stopped!"

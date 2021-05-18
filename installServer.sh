#!/bin/sh
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install
ECHO .
ECHO . 
ECHO TopMSV installation finished. 
ECHO Run startServer.sh to start TopMSV. 
#!/bin/sh
cd ../../
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install
echo .
echo . 
echo TopMSV installation finished. 
echo Run startServer.sh to start TopMSV. 

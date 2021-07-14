#!/bin/sh
sudo apt-get update
sudo apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install
cd public/resources/topview
npm install
echo .
echo . 
echo TopMSV installation finished. 
echo Run startServer.sh to start TopMSV. 

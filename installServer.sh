#!/bin/sh
sudo apt-get update
sudo apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y nodejs build-essential
sudo apt-get install python-is-python3 
npm install
echo .
echo . 
echo TopMSV installation finished. 
echo Run startServer.sh to start TopMSV. 

# Top View
A cloud-based process and visualization Nodejs app
## Linux (Ubuntu):
```sh
# install compiling tools
sudo apt-get install build-essential cmake

# install other dependencies
sudo apt-get install zlib1g-dev libboost-filesystem-dev \
                       libboost-program-options-dev \
                       libboost-system-dev \
                       libboost-thread-dev \
                       libboost-iostreams-dev \
                       libboost-chrono-dev \
                       libxalan-c-dev
sudo apt-get install nodejs
sudo apt-get install npm

# install pm2 and set it as a daemon on system startup
sudo npm install -g bufferutil
sudo npm install -g  utf-8-validate
sudo npm install -g pm2
sudo pm2 startup systemd

# install npm dependencies
npm install

# building cpp program and back to app root folder
cd cpp/build
cmake ..
make
cd ..
cd ..

# start server by pm2
pm2 start ecosystem.config.js --env production
```

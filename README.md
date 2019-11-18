# Spectra Dataset upload and process

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
sudo npm install

# building
cd cpp
mkdir build
cd build
cmake ..
make
cd ..

# set up server port
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
sudo service network-manager restart

# start server
node server.js
```

Open http://localhost:8080/ to upload files

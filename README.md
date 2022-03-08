# TopMSV Server
A web-based platform for mass spectrometry data processing and visualization. 
## 1. Linux setup (Ubuntu):

### 1.1 Install nodejs
```sh
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.2 Install nodejs libraries
```sh
cd server
npm install --save-dev
```

### 1.3 Compile TypeScript files
```sh
tsc --build tsconfig.json
```

### 1.4 Compile mzMLReader
```sh
cd src/ms_converter/
mkdir build
cd build
cmake ..
make -j$(nproc)
cd ../../../server
mkdir cpp
cp -r ../src/ms_converter/bin ./cpp
```

### 1.5 Compile TopPIC Suite
This step compiles TopFD and TopPIC, two tools in TopPIC Suite. TopFD deconvolutes top-down mass spectra and TopPIC identifies proteoforms by search top-down mass spectra against a protein database.<br/>
a. Download TopPIC Suite version 1.5.2 from <a href="https://github.com/liuxiaowen/proteomics_cpp/releases">TopPIC Suite Github repository</a> and save the zip file in the folder src. <br/>
d. Type the following commands to build TopPIC Suite: <br/>
```sh
# unzip the TopPic Suite release from the TopPIC Suite repository
unzip toppic-suite-*.zip                            
rm toppic-suite-*.zip
mv toppic-suite-* src/proteomics_cpp

# install compiling tools
sudo apt-get install build-essential cmake

# install other dependencies
sudo apt-get install zlib1g-dev \
                     libxerces-c-dev \ 
                     libboost-filesystem-dev \
                     libboost-program-options-dev \
                     libboost-system-dev \
                     libboost-thread-dev \
                     libboost-iostreams-dev \
                     libboost-chrono-dev \
                     libeigen3-dev \
                     nlohmann-json3-dev

# building TopFD and TopPIC
cd src/proteomics_cpp
mkdir build
cd build
cmake ..
#Make sure to use the exact command below to build only TopFD and TopPIC. 
#Using "make" to build all apps will result in error.
make topfd -j$(nproc) && make toppic -j$(nproc) 
#Copy binary files
cd ../../../server
mkdir proteomics_cpp
cp -r ../src/proteomics_cpp/bin ./proteomics_cpp
cp -r ../src/proteomics_cpp/resources ./proteomics_cpp/bin
```

### 1.6 Start TopMSV server
```sh
cd server
node server.js
```

## Windows setup:
### Compilation
1. mzMLReader compilation:<br/>
a. To build mzMLReader, MSYS2 needs to be installed to install required packages. Please follow the instructions in the <a href="https://www.msys2.org/">MSYS2</a> website to install MSYS2.<br/>
b. After installing MSYS2, run the following commands to in an <strong>MSYS shell</strong> to install packages for mzMLReader.<br/>
```sh
pacman -S mingw-w64-x86_64-gcc
pacman -S mingw-w64-x86_64-make
pacman -S mingw-w64-x86_64-cmake
pacman -S mingw-w64-x86_64-boost
```
&emsp;&emsp;c. After installing, please add <code>C:\msys64\mingw64\bin</code> into your PATH environmental variable.<br/>
&emsp;&emsp;d. In the root directory of TopMSV, run the following commands in a <strong> Windows Command Prompt</strong>.

```sh
cd src\ms_converter
mkdir build
cd build
cmake -G "MinGW Makefiles" ..
mingw32-make
```
### Installation
1. TopPIC Suite installation:<br/>
a. Visit <a href="https://www.toppic.org/software/toppic/register.html">TopPIC Suite website</a> to download the latest TopPIC Suite for Windows. <br/>
b. Put the downloaded zip file in the directory where the TopMSV source files are unzipped. For instance, if you unzipped the TopMSV source zip file in <code>C:\Documents</code>, the source files are in <code>C:\Documents\topmsv-[version-number]</code>. Put the TopPIC Suite zip file inside the folder.<br/>
c. Use the commands below to unzip files in a folder:<br/>
```sh
mkdir src\proteomics_cpp 
move toppic-windows-*.zip src\proteomics_cpp
cd src\proteomics_cpp 
#at this point, you should be in C:\Documents\topmsv-[version_num]\src\proteomics_cpp, if unzipped the TopMSV zip file at C:\Documents
tar -xf toppic-windows-*.zip
del toppic-windows-*.zip
move toppic-windows-* bin
```
2. Node.js and node packages installation: <br/>
a. Download and install the latest <a href="https://nodejs.org/en/">Node.js</a> if it is not installed already. Then run the following command in the root directory of TopMSV (at the directory <code>topmsv-[version_num]</code>)
```sh
cd server
npm install
```
## Start/Stop TopMSV 
At the root directory of TopMSV (<code>topmsv-[version_num]</code>), use the command <code>node server</code> to start TopMSV and ctrl+c to close TopMSV. 
<br/><br/>Or, you can run scripts to start/stop TopMSV. For Linux, go to the <code>topmsv-[version_num]/scripts/linux</code> folder and run "startServer.sh" and "stopServer.sh" to start and close TopMSV. For Windows, go to the <code>topmsv-[version_num]/scripts/windows</code> folder run "startServer.bat" and "stopServer.bat" to start and close TopMSV. 


## (optional) Run TopMSV Server with pm2

```sh
# install pm2 and set it as a daemon on system startup
sudo npm install -g bufferutil
sudo npm install -g utf-8-validate
sudo npm install -g pm2
sudo pm2 startup systemd

# start server by pm2
pm2 start ecosystem.config.js --env production

```
---
## TopMSV Server Design Summary
### Server entry point
Server.js under the root directory is the entry point of TopMSV Server backend server. It contains serveral functions:
1. It will use Express.js to listen 8443 port for incoming https requests.
2. It can check expired projects and remove them from server at every midnight.
3. It will set up a task scheduler to make sure that server always has enough resourses to respond user requests.
4. It uses all express.js routers for TopMSV Server server.
5. It creates server database during server startup.
6. It creates connection to email sender account.
7. It can automatically close the server when the process is killed.
8. It sets up middlewares for express.js.

### Server express.js routers
All Express.js routers are under router directory, it provides many useful routers to handle requests from clients. At the beginning of each router, you can find specific comments for describing how to use the router and what the router is used for. If you need create new routers for TopMSV Server, please add it under router directory, then import the added router in server.js.

### Server library
TopMSV Server library provides rich methods to do fundamental work for server, including database query and file manipulation. Usually, these methods will be called by Express.js routers so that routers can handle requeset and render corresponding results back to users. Because there are many methods in the library, a clear JSDoc is provided in JSDoc_docs directory. You can always look up this html documentation to get the information you want.

### JSDoc
JSDoc folder contains html style instruction documents for TopMSV Server library. In order to view JSDoc, you need start from index.html in JSDoc_docs folder. From here, you will find method description, input value, return value of each module. After creating new modules in library, you should always generate JSDoc again. You can find how to generate it on the index.html page.

### Frontend JavaScript and CSS
Most frontend JavaScript files and css files are stored in public folder. Here you can find TopMSV Server frontend library, for example, class to draw spectrum graph, intensity-retention time graph, prsm graph and more. Usually, the javascript file and css file name are corresponding to the page name, except some complicated pages like result page. Inside public folder, there is a resources folder, TopMSV Server here is copied from github repo proteomics_cpp/toppic_resources.

### mzML reader C++ program
mzML reader is an external c++ program to process raw mzml file and convert it into sqlite database. To compile it, boost-library, pwiz mzml process library and sqlite library are required, please refer setup steps to install those dependencies first. This mzML reader could be run on different OS environment after proper compilation. A cmake file is provided to help you complie the program.

### Data storage folder
The folder data is an empty folder for storing users data on the server. A placeholder file is used to preserve the empty folder. Each project will have a unique id as the file folder after users create and upload their projects on the server. At the same time, server database should also maintain the directory of each project from users.

### Server database folder
Server sqlite database is stored in db folder. A placehoder file is used to preserve the empty folder in github. Server.js will create a server database during startup if it does not exist already. This sqlite database should mainly contain users information, user projects information and a task queue for scheduling tasks on server. 

### Views of EJS templates
Views folder is used for storing EJS (Embedded JavaScript templates). EJS can help server generate dynamic html page for different users, for example, different users should have different project center which has different project list. EJS engine has been added into Express.js as a middleware, so server can create html pages based on these EJS templates. Partials folder contains a identical head for most pages templates, in this way you do not need to write the same codes for all EJS templates.

### JavaScript Utilities for server
Utilities folder consists of several JavaScript applications which can help convert results from general format like txt files into sqlite database. These processes are helpful when users run Toppic and TopFD on server or users upload their own msalign and sequence results. Server can use these JavaScript utilities to process those text files and store information into database for future use.

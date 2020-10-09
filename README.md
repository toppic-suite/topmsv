# TopView
A cloud-based MS data processing and visualization platform.
## Linux setup (Ubuntu):
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
sudo npm install -g utf-8-validate
sudo npm install -g pm2
sudo pm2 startup systemd

# install npm dependencies
npm install

# building cpp program and back to app root folder
cd cpp/build
cmake ..
make
cd ../..

# go to public/resources/topview and install dependencies for this folder
cd public/resources/topvew
npm install
cd ../../..

# copy and build proteomics_cpp for topview
# please go to https://github.iu.edu/xwliu/proteomics_cpp and follow the instruction there

# modify auth.js callbackURL for your use

# start server by pm2
pm2 start ecosystem.config.js --env production

# if you just want to run topview for yourself, start topview locally without pm2
npm start
```
For more information about TopView setup, please visit TopView wiki page.

---
## TopView Design Summary
### Server entry point
Server.js under the root directory is the entry point of TopView backend server. It contains serveral functions:
1. It will use Express.js to listen 8443 port for incoming https requests.
2. It can check expired projects and remove them from server at every midnight.
3. It will set up a task scheduler to make sure that server always has enough resourses to respond user requests.
4. It uses all express.js routers for TopView server.
5. It creates server database during server startup.
6. It creates connection to email sender account.
7. It can automatically close the server when the process is killed.
8. It sets up middlewares for express.js.

### Server express.js routers
All Express.js routers are under router directory, it provides many useful routers to handle requests from clients. At the beginning of each router, you can find specific comments for describing how to use the router and what the router is used for. If you need create new routers for TopView, please add it under router directory, then import the added router in server.js.

### Server library
TopView library provides rich methods to do fundamental work for server, including database query and file manipulation. Usually, these methods will be called by Express.js routers so that routers can handle requeset and render corresponding results back to users. Because there are many methods in the library, a clear JSDoc is provided in JSDoc_docs directory. You can always look up this html documentation to get the information you want.

### JSDoc
JSDoc folder contains html style instruction documents for topview library. In order to view JSDoc, you need start from index.html in JSDoc_docs folder. From here, you will find method description, input value, return value of each module. After creating new modules in library, you should always generate JSDoc again. You can find how to generate it on the index.html page.

### Frontend JavaScript and CSS
Most frontend JavaScript files and css files are stored in public folder. Here you can find topview frontend library, for example, class to draw spectrum graph, intensity-retention time graph, prsm graph and more. Usually, the javascript file and css file name are corresponding to the page name, except some complicated pages like result page. Inside public folder, there is a resources folder, topview here is copied from github repo proteomics_cpp/toppic_resources.

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
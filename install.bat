:: build mzMLReader 
cd cpp
mkdir build
cd build
cmake -G "MinGW Makefiles" ..
mingw32-make
cd ../../
:: dependency installation
call npm install
cd public/resources/topview/
call npm install

echo ****INSTALLATION COMPLETE****
pause
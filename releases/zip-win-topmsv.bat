rmdir /S /Q topmsv-%1
mkdir topmsv-windows-%1
mkdir topmsv-windows-%1\cpp\bin
mkdir topmsv-windows-%1\data
mkdir topmsv-windows-%1\db
mkdir topmsv-windows-%1\tmp
mkdir topmsv-windows-%1\log

copy ..\cpp\bin\mzMLReader.exe topmsv-windows-%1\cpp\bin

Xcopy ..\library topmsv-windows-%1\library\ /S
Xcopy ..\proteomics_cpp topmsv-windows-%1\proteomics_cpp\ /S
Xcopy ..\public topmsv-windows-%1\public\ /S
Xcopy ..\router topmsv-windows-%1\router\ /S
Xcopy ..\utilities topmsv-windows-%1\utilities\ /S
Xcopy ..\views topmsv-windows-%1\views\ /S
Xcopy ..\node_modules topmsv-windows-%1\node_modules\ /S

copy ..\*.js topmsv-windows-%1
copy ..\*.json topmsv-windows-%1
copy ..\*Windows.html topmsv-windows-%1
copy ..\*.ini topmsv-windows-%1
copy ..\*.bat topmsv-windows-%1
copy ..\*.vbs topmsv-windows-%1
copy ..\*.exe topmsv-windows-%1
copy ..\node* topmsv-windows-%1
copy ..\npm* topmsv-windows-%1
copy ..\npx* topmsv-windows-%1

copy ..\LICENSE topmsv-windows-%1
copy ..\README.md topmsv-windows-%1

copy C:\msys64\mingw64\bin\libboost_chrono-mt.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_filesystem-mt.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_iostreams-mt.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_program_options-mt.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_system-mt.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_thread-mt.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libbz2-1.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libgcc_s_seh-1.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\liblzma-5.dll topmsv-windows-%1\cpp\bin\
copy "C:\msys64\mingw64\bin\libstdc++-6.dll" topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libwinpthread-1.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libzstd.dll topmsv-windows-%1\cpp\bin\
copy C:\msys64\mingw64\bin\zlib1.dll topmsv-windows-%1\cpp\bin\

cd topmsv-windows-%1
call installServer.bat
cd ..\..\
del installServer.bat

pause

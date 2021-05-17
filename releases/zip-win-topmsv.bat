rmdir /S /Q topmsv-%1
mkdir topmsv-%1
mkdir topmsv-%1\cpp\bin
mkdir topmsv-%1\data
mkdir topmsv-%1\db
mkdir topmsv-%1\tmp

copy ..\cpp\bin\mzMLReader.exe topmsv-%1\cpp\bin

Xcopy ..\library topmsv-%1\library\ /S
Xcopy ..\proteomics_cpp topmsv-%1\proteomics_cpp\ /S
Xcopy ..\public topmsv-%1\public\ /S
Xcopy ..\router topmsv-%1\router\ /S
Xcopy ..\utilities topmsv-%1\utilities\ /S
Xcopy ..\views topmsv-%1\views\ /S

copy ..\data\.placeholder topmsv-%1\data
copy ..\db\.placeholder topmsv-%1\db
copy ..\tmp\.placeholder topmsv-%1\tmp

copy ..\*.js topmsv-%1
copy ..\*.json topmsv-%1
copy ..\*.html topmsv-%1
copy ..\*.ini topmsv-%1
copy ..\*.bat topmsv-%1
copy ..\*.vbs topmsv-%1

copy ..\LICENSE topmsv-%1
copy ..\README.md topmsv-%1

copy C:\msys64\mingw64\bin\libboost_chrono-mt.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_filesystem-mt.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_iostreams-mt.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_program_options-mt.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_system-mt.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libboost_thread-mt.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libbz2-1.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libgcc_s_seh-1.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\liblzma-5.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libstdc++-6.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libwinpthread-1.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\libzstd.dll topmsv-%1\cpp\bin\
copy C:\msys64\mingw64\bin\zlib1.dll topmsv-%1\cpp\bin\

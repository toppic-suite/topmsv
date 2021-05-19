#!/bin/sh
set -x
if [ "$#" -ne 1 ];then
  echo "Usage: $0 version_number" >&2
  exit 1
fi

rm -rf topmsv-linux-${1}
mkdir topmsv-linux-${1}
mkdir topmsv-linux-${1}/cpp
mkdir topmsv-linux-${1}/cpp/bin
mkdir topmsv-linux-${1}/cpp/bin/mzMLReader_resources
mkdir topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib

cp ../cpp/bin/mzMLReader topmsv-linux-${1}/cpp/bin

cp ../*.js topmsv-linux-${1}
cp ../*.json topmsv-linux-${1}
cp ../How-to-install-TopMSV-Linux.html topmsv-linux-${1}
cp ../*.ini topmsv-linux-${1}
cp ../*.sh topmsv-linux-${1}
cp ../LICENSE topmsv-linux-${1}
cp ../README.md topmsv-linux-${1}

cp -r ../library/ topmsv-linux-${1}
cp -r ../proteomics_cpp topmsv-linux-${1}
cp -r ../public topmsv-linux-${1}
cp -r ../router topmsv-linux-${1}
cp -r ../utilities topmsv-linux-${1}
cp -r ../views topmsv-linux-${1}

cp /lib/x86_64-linux-gnu/libdl.so.2 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /usr/lib/x86_64-linux-gnu/libboost_filesystem.so.1.71.0 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /usr/lib/x86_64-linux-gnu/libboost_thread.so.1.71.0 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /usr/lib/x86_64-linux-gnu/libboost_iostreams.so.1.71.0 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /usr/lib/x86_64-linux-gnu/libboost_chrono.so.1.71.0 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib/x86_64-linux-gnu/libpthread.so.0 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib/x86_64-linux-gnu/libz.so.1 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /usr/lib/x86_64-linux-gnu/libstdc++.so.6 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib/x86_64-linux-gnu/libm.so.6 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib/x86_64-linux-gnu/libgcc_s.so.1 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib/x86_64-linux-gnu/libc.so.6 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib64/ld-linux-x86-64.so.2 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib/x86_64-linux-gnu/libbz2.so.1.0 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /lib/x86_64-linux-gnu/liblzma.so.5 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/
cp /usr/lib/x86_64-linux-gnu/libzstd.so.1 topmsv-linux-${1}/cpp/bin/mzMLReader_resources/lib/

zip -r topmsv-linux-${1}.zip topmsv-linux-${1}

#include "msReader.hpp"
#include <time.h>
#include <iostream>

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cout << argv[0] << "file.mzML -s scan" <<std::endl;
        std::cout << argv[0] << "file.mzML -r" <<std::endl;
        std::cout << argv[0] << "file.mzML -f" <<std::endl;
    }
    msReader msreader(argv[1]);
    if (strcmp(argv[2],"-s") == 0) {
        msreader.getPeaksFromScanDB(atoi(argv[3]));
    } else if (strcmp(argv[2],"-r") == 0) {
        msreader.getScanRangeDB();
    } else if (strcmp(argv[2],"-f") == 0) {
        std::cout << "mzMLReader running" << std::endl;
        msreader.createDtabase();//create db for 2d and 3d viz
    }
}
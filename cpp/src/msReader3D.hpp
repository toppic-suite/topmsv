#ifndef MSREADER3D_HPP_
#define MSREADER3D_HPP_


#include <iostream>
#include <memory>
#include <cmath>
#include <string>
#include <fstream>
#include <vector>
#include "mzMLReader3D.hpp" 

#include "pwiz/data/msdata/DefaultReaderList.hpp"
#include "pwiz/data/msdata/MSDataFile.hpp"

#include "pwiz/data/msdata/SpectrumList_mzML.hpp"
#include "pwiz/data/msdata/SpectrumInfo.hpp"
#include "pwiz/utility/misc/Std.hpp"
#include <time.h>
using namespace pwiz::msdata;
// using namespace std;

bool cmpPoints(Point p1, Point p2);
std::string getScan(std::string id);
typedef std::shared_ptr<pwiz::msdata::MSDataFile> MSDataFilePtr;

class msReader
{
public:
	pwiz::msdata::DefaultReaderList readers_;
	MSDataFilePtr msd_ptr_;
	pwiz::msdata::SpectrumListPtr spec_list_ptr_;



	msReader(std::string filename);
	std::string file_name;
	//pwiz::msdata::MSData test_msdata;
	//boost::shared_ptr<std::istream> is;
	//Index_mzML_Ptr index;
	SpectrumListPtr sl;
	mzMLReader databaseReader;
	Range RANGE;
	void getScans(int scanLevel);
	void getSinglePeaks(int scan);
	void getScanRangeDB();
	void getRange();
	void getAllPeaks(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin);
	void createDtabase_normal();
	void createDtabase();
	void getRangeDB();
	void getPeaksFromScanDB(int scan);
	void getAllPeaksDB(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin);
	void getRangeFromRaw();
	void createDtabaseOneTable();
	void getRangeDBOneTable();
	void getAllPeaksDBOneTable(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin);
	void createDtabaseOneTableRTree();
	void getAllPeaksDBOneTableRTree(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin);
};


#endif

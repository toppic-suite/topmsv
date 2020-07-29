#ifndef MZMLREADER_HPP_
#define MZMLREADER_HPP_


#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <math.h> 
//#include <sqlite3.h> 
//#include <libraries\SQLite\sqlite3.h>
#include "sqlite/sqlite3.h"
#include <time.h>
using namespace std;

struct Point{
  double mz;
  double rt;
  double inten;
};
struct Range{
  double MZMIN;
  double MZMAX;
  double RTMIN;
  double RTMAX;
  double INTMIN;
  double INTMAX;
  int SCANCOUNT;
  int COUNT;
  int LAYERCOUNT = 5;
  int MAXRETURN = 5000;
  //vector<double> MZSIZE;
  //vector<double> RTSIZE;
  int MINPEAKS = 3000; //minimum peak needed to create a new table 
  double MZSCALE = 2;//number to scale m/z range of a grid block
  double MZSIZE = 0.1;//initial mz size of a grid block

  double RTSCALEFACTOR = 2;
  double RTSCALE = 2;
  double RTSIZE = 1;

  int SCANSIZE = 5000;//total length of y in entire grid x * y. So initial rt size of a grid block is 1
  std::string TARGET = "";
};
struct Grid{
	vector<vector<int>> GRIDSIZES;
	vector<vector<vector<double> > > GRIDBLOCKS;
};

int callback(void *NotUsed, int argc, char **argv, char **azColName);
std::string num2str(double num);
std::string int2str(int num);
class mzMLReader
{
public:
	std::string databaseName;
	std::string databaseNameInMemory;
	sqlite3 *db;
	sqlite3 *dbInMemory;
	char *zErrMsg = 0;
	int  rc;
	char *sql;
	char *data;
	bool isNew;

	mzMLReader();
	void setName(std::string fileName);
	void setNameInMemory(std::string fileName);
	void openDatabase(std::string fileName);
	void openDatabaseInMemory(std::string fileName);
	void closeDatabase();
	void closeDatabaseInMemory();
	void creatTable();
	void creatTableInMemory();
	void insertSp(int scanIndex, std::string scan, double retentionTime);
	void insertPeak(int peakIndex, int scanIndex, double intensity, double mz);
	void getRange();
	void getScanRange();
	void getPeaksFromScan(int scan);
	void getPeaks(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin);
	void beginTransaction();
	void endTransaction();
	void beginTransactionInMemory();
	void endTransactionInMemory();
	void synchronous();
	void openInsertStmt();
	void openInsertStmtMs1Only();
	void openInsertStmtInMemory();
	void closeInsertStmt();
	void closeInsertStmtMs1Only();
	void closeInsertStmtInMemory();
	void insertSpStmt(int scanIndex, std::string scan, double retentionTime, int scanLevel, double prec_mz, int prec_charge, double prec_inte, double peaksInteSum, int next, int prev);
	void insertScanLevelPairStmt(int scanLevelOne, int scanLevelTwo);
	void updateSpStmt(int currentID, int prevID);
	void updateSpSumStmt(int currentID, double peaksInteSum);
	void insertPeakStmt(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime);
	void insertPeakStmtMs1(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime);
	void insertPeakStmtInMemory(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime);
	void createIndex();
	void createIndexOnIdOnly();

	double MZ_GROUP1_SIZE;
	double MZ_GROUP2_SIZE;
	double MZ_GROUP3_SIZE;
	double MZ_GROUP4_SIZE;
	double MZ_GROUP5_SIZE;
	double RT_GROUP1_SIZE;
	double RT_GROUP2_SIZE;
	double RT_GROUP3_SIZE;
	double RT_GROUP4_SIZE;
	double RT_GROUP5_SIZE;
	int MZ_GROUP1;
	int MZ_GROUP2;
	int MZ_GROUP3;
	int MZ_GROUP4;
	int MZ_GROUP5;
	int RT_GROUP1;
	int RT_GROUP2;
	int RT_GROUP3;
	int RT_GROUP4;
	int RT_GROUP5;

	void resetRange();
	void insertPeakDataToGridBlocks();
	void createSmallestTable(int &table_cnt, std::vector<int> &prev_peak_ID);
	void assignDataToGrid(int table_cnt, std::vector<int> &selected_peak_ID);
	void insertPeaksToEachLayer(int table_cnt, int scan_id);
	void insertDataLayerTable();
	void setRange(Range tmpRange);
	void setGroup(double mz, double rt);
	std::string getGroup(double mzmin, double mzmax, double rtmin, double rtmax);
	void creatTableOneTable();
	void insertPeakOneTable(int peakIndex, int scanIndex, double intensity, double mz);
	void getRangeOneTable();
	void getPeaksOneTable(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin);
	void openInsertStmtOneTable();
	void closeInsertStmtOneTable();
	void insertPeakStmtOneTable(int peakIndex, int scanIndex, double mz, double intensity, double retentionTime);
	void insertConfigOneTable();
	//void createIndexLayerTable(std::string num);
	void createIndexOneTable();
	//void creatLayersTable();
	void createLayerTable(std::string num);
	void getConfig();
	void openInsertLayerStmt(std::string num);
	void closeInsertLayerStmt();
	void insertPeaksLayerStmt(std::string origin, int j, int k, double mzsize, double rtsize);
	void creatLayersTableRTree();
	void createLayerTableRTree(std::string num);
	void openInsertLayerStmtRTree(std::string num);
	void closeInsertLayerStmtRTree();
	void insertAllPeaksLayerStmtRTree();
	void insertPeaksLayerStmtRTree(std::string origin, int j, int k, double mzsize, double rtsize);
	void getPeaksOneTableRTree(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin);
	void createIndexLayerTable();
};


#endif
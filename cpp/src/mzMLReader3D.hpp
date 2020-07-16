#ifndef MZMLREADER3D_HPP_
#define MZMLREADER3D_HPP_

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
  int COUNT;
  int LAYERCOUNT = 5;
  int MINPEAKS = 3000; //minimum peak needed to create a new table 
  double MZSCALE = 2;//number to scale m/z range of a grid block

  double SCANSCALE = 1;//number to scale m/z range of a grid block. This number becomes smaller when peak count < SCANCNT
  double MZSIZE = 0.1;//initial mz size of a grid block
  int SCANCNT = 5000;//total length of y in entire grid x * y. So initial rt size of a grid block is 1

  std::string TARGET = "";
};

//value of n and m in n * m grid on graph

struct Grid{
	vector<vector<int>> GRIDSIZES;
	vector<vector<vector<double> > > GRIDBLOCKS;
};

int callback(void *NotUsed, int argc, char **argv, char **azColName);
std::string num2str(double num);
std::string int2str(int num);
class mzMLReader3D
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

	mzMLReader3D();
	void setName(std::string fileName);
	void setNameInMemory(std::string fileName);
	void openDatabaseInMemory(std::string fileName);
	void openDatabase(std::string fileName);
	void closeDatabase();
	void closeDatabaseInMemory();
	void creatTable();
	void creatTableInMemory();
	void getScanRange();
	void beginTransaction();
	void endTransaction();
	void beginTransactionInMemory();
	void endTransactionInMemory();
	void openInsertStmtBothMs();
	void openInsertStmt();
	void openInsertStmtInMemory();
	void closeInsertStmt();
	void closeInsertStmtInMemory();
	void insertSpStmt(int scanIndex, std::string scan, double retentionTime, int scanLevel, double prec_mz, int prec_charge, double prec_inte, double peaksInteSum, int next, int prev);
	void updateSpStmt(int currentID, int prevID);
	void updateSpSumStmt(int currentID, double peaksInteSum);
	void insertPeakStmtBothMs(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime);
	void insertPeakStmt(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime);
	void insertPeakStmtInMemory(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime);
	void createIndexOnIdOnly();

	void resetRange();
	void insertPeakDataToGridBlocks();
	void createSmallestTable(int &table_cnt, std::vector<int> &prev_peak_ID);
	void assignDataToGrid(int table_cnt, std::vector<int> &selected_peak_ID);
	void insertPeaksToEachLayer(int table_cnt, int scan_id);
	void insertDataLayerTable();
	void setRange(Range tmpRange);
	void insertPeakOneTable(int peakIndex, int scanIndex, double intensity, double mz);
	void getRangeOneTable();
	void insertConfigOneTable();
	void createLayerTable(std::string num);
	void openInsertLayerStmt(std::string num);
	void closeInsertLayerStmt();	
	void createIndexLayerTable();
};


#endif
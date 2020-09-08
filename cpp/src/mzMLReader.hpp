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
  int LAYERCOUNT = 0;
  int MAXRETURN = 5000;
  int MINPEAKS = 3000; //minimum peak needed to create a new table 
  double MZSCALE = 2;//number to scale m/z range of a grid block
  double MZSIZE = 0.05;//initial mz size of a grid block

  double RTSCALEFACTOR = 2;
  double RTSCALE = 2;
  double RTSIZE = 1;

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
	//original
	//std::vector<std::string> peakColor{"#9be7ff", "#77eddb", "#56f3ba", "#3ef7a2", "#24fc87", "#11ff74", "#33fc61", "#5ef94a", "#89f633", "#abf320", "#e6ef00", "#eae503", "#efd807", "#f4ca0a", "#fabd0e", "#ffaf11", "#ff8c0e", "#ff690b", "#ff4607", "#ff2a04", "#ff0000"};
	//more diversity in colors
	//std::vector<std::string> peakColor{"#460086", "#7c43b1", "#b289dc", "#c9b7da", "#7188d9", "#003bd0", "#2ec1f5", "#81d1db", "#7eb493", "#015b03", "#aee0a5", "#af92a0", "#a94882", "#d07ba3", "#f7aec3", "#fbc7a7", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"};
	//color brewer 11 colors 
	//std::vector<std::string> peakColor{"#313695", "#4575b4","#74add1","#abd9e9","#e0f3f8","#ffffbf","#fee090","#fdae61","#f46d43","#d73027","#a50026"};
	//batmass
	std::vector<std::string> peakColor{"#000030","#00007f","#0000ff","#007fff","#00ffff","#7fff7f","#ffff00","#ff7f00","#ff0000","#7f0000"};

	mzMLReader();
	void setName(std::string fileName);
	void setNameInMemory(std::string fileName);
	void openDatabase(std::string fileName);
	void openDatabaseInMemory(std::string fileName);
	void closeDatabase();
	void closeDatabaseInMemory();
	void creatTable();
	void creatTableInMemory();
	void getRange();
	void getScanRange();
	void getPeaksFromScan(int scan);
	void beginTransaction();
	void endTransaction();
	void beginTransactionInMemory();
	void endTransactionInMemory();
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
	void insertPeakStmtMs1(int peakIndex, double intensity, double mz, double retentionTime, std::string peakColor);
	void insertPeakStmtInMemory(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime, std::string peakColor);
	void createIndex();
	void createIndexOnIdOnly();
	void createIndexOnIdOnlyInMemory();

	double normalizeInte(std::vector<double> *normalizationData);
	void setColor();
	void resetRange();
	void insertPeakDataToGridBlocks();
	void createSmallestTable(int &table_cnt, std::vector<int> &prev_peak_ID);
	void assignDataToGrid(int table_cnt, std::vector<int> &selected_peak_ID);
	void insertPeaksToEachLayer(int table_cnt, int scan_id);
	void insertDataLayerTable();
	void setRange(Range tmpRange);
	void insertConfigOneTable();
	void createLayerTable(std::string num);
	void createIndexLayerTable();
};


#endif
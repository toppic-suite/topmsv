#ifndef MZMLREADER_HPP_
#define MZMLREADER_HPP_

#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <math.h> 
#include <fstream>
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
struct DataRange{
  double mz_min;
  double mz_max;
  double rt_min;
  double rt_max;
  double int_min;
  double int_max;
  int scan_count;
  int count;
  int layer_count = 0;
  int max_return = 5000;
  int min_peaks = 3000; //minimum peak needed to create a new table 
  double mz_scale = 2;//number to scale m/z range of a grid block
  double mz_size = 0.05;//initial mz size of a grid block

  double rt_scale = 2;
  double rt_size;
};
struct GridProperties{
	vector<vector<int>> grid_sizes;
	vector<double> grid_blocks;
	double cur_mz = 0;
	double cur_max_inte = 0;
};

std::string num2str(double num);
std::string int2str(int num);
void updateRange(char **argv);

int callback(void *NotUsed, int argc, char **argv, char **azColName);
int callbackRange(void *not_used, int argc, char **argv, char **az_col_name);
int callbackPeakFromScan(void *not_used, int argc, char **argv, char **az_col_name);
int callbackInsertPeak(void *not_used, int argc, char **argv, char **az_col_name);
int callbackUpdateData(void *ptr, int argc, char **argv, char **az_col_name);
int callbackConvertData(void *ptr, int argc, char **argv, char **az_col_name);

class mzMLReader
{
public:
	std::string database_name_;
	std::string database_name_in_memory_;
	sqlite3 *db_;
	sqlite3 *db_in_memory_;
	char *z_err_msg_ = 0;
	int  rc_;
	char *sql_;
	char *sql_in_mem_;
	char *data_;
	bool is_new_;
	std::vector<std::string> peak_color_{"#0000ff","#007fff","#00ffff","#7fff7f","#ffff00","#ff7f00","#ff0000"};//7 colors totla

	mzMLReader();
	void setName(std::string file_name);
	void setNameInMemory(std::string file_name);
	void openDatabase(std::string file_name);
	void openDatabaseInMemory(std::string file_name);
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
	void insertSpStmt(int scan_index, std::string scan, double retention_time, double ion_time, int scan_level, double prec_mz, int prec_charge, double prec_inte, double peaks_int_sum, int next, int prev);
	void insertScanLevelPairStmt(int scan_level_one, int scan_level_two);
	void updateSpStmt(int current_id, int prev_id);
	void updateSpSumStmt(int current_id, double peaks_int_sum);
	void insertPeakStmt(int peak_index, int scan_index, double intensity, double mz, double retention_time);
	void insertPeakStmtMs1(int peak_index, double intensity, double mz, double retention_time, std::string peak_color_);
	void insertPeakStmtInMemory(int peak_index, int scan_index, double intensity, double mz, double retention_time, std::string peakColor_);
	void createIndex();
	void createIndexOnIdOnly();
	void createIndexInMemory();
	void createLayerIndexInMemory(int table_cnt);

	double normalizeInte(std::vector<double> *normalization_data);
	void setColor();
	void insertPeakToEachLayer(std::vector<double> *grid_ptr, int table_cnt);
	void insertPeakDataToGridBlocks(int table_cnt);
	void insertPeaksToEachLayer(int table_cnt, int scan_id);
	void insertDataLayerTable();
	void setRange(DataRange Tmp_range);
	void resetRange();
	void insertConfigOneTable(DataRange Range);
	void createLayerTable(std::string num);
	void createIndexLayerTable();
};


#endif
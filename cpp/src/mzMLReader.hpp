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
  double rt_divider = 1;
};
struct GridProperties{
	vector<vector<int>> grid_sizes;
	vector<double> grid_blocks;
	double cur_mz = 0;
	double cur_max_inte = 0;
	bool is_new_row = true;
};
struct peakProperties {
	int id;
	double mz;
	double inte;
	double rt;
	int color;
	//std::string color;
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
	sqlite3 *db_;
	char *z_err_msg_ = 0;
	int  rc_;
	char *sql_;
	char *sql_in_mem_;
	char *data_;
	bool is_new_;
	//std::vector<std::string> peak_color_{"#0000ff","#007fff","#00ffff","#7fff7f","#ffff00","#ff7f00","#ff0000"};//7 colors totla
	std::vector<int> peak_color_{0,1,2,3,4,5,6};//7 colors totla
	std::vector<peakProperties> all_ms1_peaks_;

	mzMLReader();
	void setName(std::string file_name);
	void openDatabase(std::string file_name);
	void closeDatabase();
	void creatTable();
	void getRange();
	void getPeaksFromScan(int scan);
	void beginTransaction();
	void endTransaction();
	void openInsertStmt();
	void openInsertStmtMs1Only(int table_cnt);
	void closeInsertStmt();
	void closeInsertStmtMs1Only();
	void insertSpStmt(int scan_index, std::string scan, double retention_time, double ion_time, int scan_level, double prec_mz, int prec_charge, double prec_inte, double peaks_int_sum, int next, int prev, double mz_low, double mz_high);
	void insertScanLevelPairStmt(int scan_level_one, int scan_level_two);
	void updateSpStmt(int current_id, int prev_id);
	void updateSpSumStmt(int current_id, double peaks_int_sum);
	void insertPeakStmt(int peak_index, std::string scan, double intensity, double mz, double retention_time);
	void insertPeakStmtMs1(int peak_index, double intensity, double mz, double retention_time, int peak_color_);
	void createIndex();
	void createIndexOnIdOnly();
	void createLayerIndex(int table_cnt);

	double normalizeInte(std::vector<double> *normalization_data);
	void setColor();
	void insertPeakToEachLayer(std::vector<peakProperties> *grid_ptr, int table_cnt);
	void assignPeakDataToGridBlocks(std::vector<peakProperties> *grid_ptr, int & table_cnt);
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
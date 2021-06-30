#include "mzMLReader.hpp" 
#include <string.h>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <fstream>
#include <iomanip>
#include <cmath>

DataRange Range;//range value of entire mzML
DataRange SingleTableRange;//range value of each table
GridProperties Grid;
sqlite3_stmt *stmt_sp;
sqlite3_stmt *stmt_peak;
sqlite3_stmt *stmt_peak_ms1_only;
sqlite3_stmt *stmt_peak_ms1_only_in_memory;
sqlite3_stmt *stmt_peak_in_memory;
sqlite3_stmt *stmt_level_pair;
sqlite3_stmt *stmt_update;
sqlite3_stmt *stmt_sp_sum_update;

int peak_in_grid = 0;

bool sortByRt(peakProperties p, peakProperties q) { return (p.rt < q.rt);} 
bool sortByMz(peakProperties p, peakProperties q) { return (p.mz < q.mz);} 

std::string num2str(double num) {
  // std::cout << num << std::endl;
  stringstream stream;
  stream<<num;
  return stream.str();
};
std::string int2str(int num) {
  // std::cout << num << std::endl;
  stringstream stream;
  stream<<std::fixed<<num;
  return stream.str();
};
void updateRange(peakProperties peak){
  if (peak.mz > SingleTableRange.mz_max){
    SingleTableRange.mz_max = peak.mz;
  }
  else if(peak.mz < SingleTableRange.mz_min){
    SingleTableRange.mz_min = peak.mz;
  }
  if (peak.inte > SingleTableRange.int_max){
    SingleTableRange.int_max = peak.inte;
  }
  else if(peak.inte < SingleTableRange.int_min){
    SingleTableRange.int_min = peak.inte;
  }
  if (peak.rt > SingleTableRange.rt_max){
    SingleTableRange.rt_max = peak.rt;
  }
  else if(peak.rt < SingleTableRange.rt_min){
    SingleTableRange.rt_min = peak.rt;
  }
}

void updateRange(char **argv){
  if (std::stod(argv[1]) > SingleTableRange.mz_max){
    SingleTableRange.mz_max = std::stod(argv[1]);
  }
  else if(std::stod(argv[1]) < SingleTableRange.mz_min){
    SingleTableRange.mz_min = std::stod(argv[1]);
  }
  if (std::stod(argv[2]) > SingleTableRange.int_max){
    SingleTableRange.int_max = std::stod(argv[2]);
  }
  else if(std::stod(argv[2]) < SingleTableRange.int_min){
    SingleTableRange.int_min = std::stod(argv[2]);
  }
  if (std::stod(argv[3]) > SingleTableRange.rt_max){
    SingleTableRange.rt_max = std::stod(argv[3]);
  }
  else if(std::stod(argv[3]) < SingleTableRange.rt_min){
    SingleTableRange.rt_min = std::stod(argv[3]);
  }
}

int callback(void *not_used, int argc, char **argv, char **az_col_name) {
  int i;
  for(i=0; i<argc; i++){
    // printf("%s = %s\n", azColName[i], argv[i] ? argv[i] : "NULL");
    std::cout << az_col_name[i] << " = " << (argv[i] ? argv[i] : "NULL") << std::endl;
  }
  // printf("\n");
  std::cout << std::endl;
  return 0;
};
int callbackRange(void *not_used, int argc, char **argv, char **az_col_name) {
  for (int i = 0; i < argc; i++) {
    if (i > 1 && i < 4) {
      std::cout << std::stod(argv[i])/60 << "\t"; 
    } else {
      std::cout << argv[i] << "\t"; 
    }
  }
  return 0;
};
int callbackPeakFromScan(void *not_used, int argc, char **argv, char **az_col_name) {
  std::cout << argv[0] << "," << argv[1] << std::endl ;
  return 0;
}
int callbackInsertPeak(void *not_used, int argc, char **argv, char **az_col_name) {
  sqlite3_reset(stmt_peak);
  sqlite3_bind_int(stmt_peak,1,std::stoi(argv[0]));
  sqlite3_bind_double(stmt_peak,2,std::stod(argv[1]));
  sqlite3_bind_double(stmt_peak,3,std::stod(argv[2]));
  sqlite3_bind_double(stmt_peak,4,std::stod(argv[3]));
  sqlite3_bind_text(stmt_peak,5, argv[4], strlen(argv[4]), SQLITE_TRANSIENT);

  int r = sqlite3_step(stmt_peak);
  if (r != SQLITE_DONE) {
    // std::cout << sqlite3_errmsg(db) << std::endl;
    std::cout << argv[0] << "," << argv[1] << "," << argv[2] << "," << argv[3] << "," << argv[4] << "\t" ;
    std::cout << "callbackInsertPeak error" << std::endl;
  }
  return 0;
};
int callbackConvertData(void *ptr, int argc, char **argv, char **az_col_name){
  //input data is each row
  //check the m/z of this row
  //1. smaller than cur_mz: compare intensity and update vector or skip this row
  //2. bigger than cur_mz: insert into the vector and update cur_mz to keep adding mz_size until cur_mz > this row's m/z
  //whenever new peak is added to the vector, update cur_max_inte as well;

  std::vector<peakProperties> *grid_ptr = reinterpret_cast<std::vector<peakProperties>*> (ptr);

  peakProperties peak;
  peak.id = std::stoi(argv[0]);
  peak.mz = std::stod(argv[1]);
  peak.inte = std::stod(argv[2]);
  peak.rt = std::stold(argv[3]);
  peak.color = std::stoi(argv[4]);

  if (std::stod(argv[1]) <= Grid.cur_mz){
    if (std::stod(argv[2]) > Grid.cur_max_inte){
      if (grid_ptr->size() > 0 && Grid.is_new_row == false) {
        grid_ptr->pop_back();//peaks in each rt range are ordered by m/z, so it is the last element that should be replaced
      }
      grid_ptr->push_back(peak);

      updateRange(argv);
      //update highest intensity in this range
      Grid.cur_max_inte = std::stod(argv[2]);
    }
  }
  else{
    //update Range information
    updateRange(argv);
    grid_ptr->push_back(peak);
    Grid.cur_max_inte = std::stod(argv[2]);

    while (Grid.cur_mz < std::stod(argv[1])){//update Grid.cur_mz
      Grid.cur_mz += Range.mz_size;
    }
    peak_in_grid++;
  }
  Grid.is_new_row = false;
  return 0;
}
/*
int callbackSmallTableData(void *ptr, int argc, char **argv, char **az_col_name){
  std::vector<double> *grid_ptr = reinterpret_cast<std::vector<double>*> (ptr);
  grid_ptr->push_back(std::stoi(argv[0]));

  return 0;
}*/
mzMLReader::mzMLReader() {
   data_ = (char*)("Callback function called");
};

void mzMLReader::setName(std::string file_name) {
   database_name_ = file_name.replace(file_name.length() - 4,4,"db");
};
void mzMLReader::openDatabase(std::string file_name) {
   setName(file_name);
   /* Open database */
   rc_ = sqlite3_open((char*)database_name_.c_str(), &db_);
   if( rc_ ){
      // fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
      std::cout << "Can't open database: " << sqlite3_errmsg(db_) << std::endl;
      exit(0);
   }else{
      // fprintf(stdout, "Opened database successfully\n");
      // std::cout << "Opened database successfully"<< std::endl;
   }
};

void mzMLReader::closeDatabase() {
   sqlite3_close(db_);
};
void mzMLReader::creatTable() {
   /* Create SQL statement */
   sql_ = (char*)("CREATE TABLE SPECTRA("  \
         "ID INTEGER PRIMARY KEY      NOT NULL," \
         "SCAN           INT      NOT NULL," \
         "RETENTIONTIME  REAL     NOT NULL," \
         "IONTIME  REAL     NOT NULL," \
         "SCANLEVEL      INT      NOT NULL," \
         "PREC_MZ        REAL     NULL," \
         "PREC_CHARGE    INT      NULL," \
         "PREC_INTE      REAL     NULL," \
         "PEAKSINTESUM   REAL     NULL," \
         "NEXT           INT      NULL," \
         "PREV           INT      NULL);");

   /* Execute SQL statement */
   rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
   if( rc_ != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
      sqlite3_free(z_err_msg_);
   }else{
      // fprintf(stdout, "Table created successfully\n");
      // std::cout << "Table SPECTRA created successfully" << std::endl;
   }

   /* Create SQL statement */
   sql_ = (char*)("CREATE TABLE PEAKS("  \
         "ID INTEGER PRIMARY KEY     NOT NULL," \
         "SPECTRAID     INT      NOT NULL REFERENCES SPEACTRA(ID)," \
         "MZ            REAL     NOT NULL," \
         "INTENSITY     REAL     NOT NULL," \
         "RETENTIONTIME     REAL     NOT NULL);");

   /* Execute SQL statement */
   rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
   if( rc_ != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
      sqlite3_free(z_err_msg_);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       std::cout << "Table PEAKS created successfully" << std::endl;
   }
  // create a table for levelOne and levelTwo pair
   /* Create SQL statement */
   sql_ = (char*)("CREATE TABLE ScanPairs("  \
         "LevelOneScanID     INT      NOT NULL REFERENCES SPECTRA(SCAN)," \
         "LevelTwoScanID     INT      NOT NULL REFERENCES SPECTRA(SCAN)," \
         "PRIMARY KEY (LevelOneScanID, LevelTwoScanID));");
   /* Execute SQL statement */
   rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
   if( rc_ != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
      sqlite3_free(z_err_msg_);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       //std::cout << "Table ScanPairs created successfully" << std::endl;
   }
   /* Create SQL statement */
   sql_ = (char*)("CREATE TABLE CONFIG("  \
         "ID  INTEGER PRIMARY KEY     NOT NULL," \
         "MZMIN           REAL     NOT NULL," \
         "MZMAX           REAL     NOT NULL," \
         "RTMIN           REAL     NOT NULL," \
         "RTMAX           REAL     NOT NULL," \
         "INTMIN          REAL     NOT NULL," \
         "INTMAX          REAL     NOT NULL," \
         "COUNT           INT     NOT NULL);");

   /* Execute SQL statement */
   rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
   if( rc_ != SQLITE_OK ){
     std::cout << sql_ << std::endl;
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      sqlite3_free(z_err_msg_);
   }else{
      // fprintf(stdout, "Table created successfully\n");
      std::cout << "One table CONFIG created successfully" << std::endl;
   }
};
void mzMLReader::getRange() {
  /* Create SQL statement */
  sql_ = (char*)("SELECT MIN(MZ),MAX(MZ) FROM PEAKS;");
  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callbackRange, (void*)data_, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << "\t";

  sql_ = (char*)("SELECT MIN(RETENTIONTIME),MAX(RETENTIONTIME) FROM SPECTRA;");
  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callbackRange, (void*)data_, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << "\t";

  /* Create SQL statement */
  sql_ = (char*)("SELECT MIN(INTENSITY),MAX(INTENSITY) FROM PEAKS;");
  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callbackRange, (void*)data_, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << std::endl;
};
void mzMLReader::getPeaksFromScan(int scan) {
  std::string sqlstr = "SELECT MZ,INTENSITY FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID=SPECTRA.ID WHERE " \
    "SCAN=" + num2str(scan) + ";";
  std::cout << sqlstr << endl;
  sql_ = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callbackPeakFromScan, (void*)data_, &z_err_msg_);
  std::cout << std::endl;
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
}
void mzMLReader::beginTransaction() {
  std::string sqlstr = "BEGIN;";
  sql_ = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    // std::cout << "Records created successfully" << std::endl;
  }
};
void mzMLReader::endTransaction() {
  std::string sqlstr = "COMMIT;";
  sql_ = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    // std::cout << "Records created successfully" << std::endl;
  }

};
void mzMLReader::openInsertStmt() {
  std::string sqlstr = "INSERT INTO SPECTRA (ID,SCAN,RETENTIONTIME,IONTIME,SCANLEVEL,PREC_MZ,PREC_CHARGE,PREC_INTE,PEAKSINTESUM,NEXT,PREV) VALUES (? ,? ,?, ?, ?, ?, ?, ?, ?, ?, ?); ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_, sql_, sqlstr.length(), &stmt_sp, 0);

  sqlstr = "INSERT INTO ScanPairs (LevelOneScanID,LevelTwoScanID) VALUES (? ,?); ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_, sql_, sqlstr.length(), &stmt_level_pair, 0);

  sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME) VALUES (? ,? ,?, ?, ?); ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_, sql_, sqlstr.length(), &stmt_peak, 0);

  sqlstr = "UPDATE SPECTRA SET NEXT = ? WHERE ID = ?; ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_, sql_, sqlstr.length(), &stmt_update, 0);

  sqlstr = "UPDATE SPECTRA SET PEAKSINTESUM = ? WHERE ID = ?; ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_, sql_, sqlstr.length(), &stmt_sp_sum_update, 0);
};
void mzMLReader::openInsertStmtMs1Only(int table_cnt) {
  std::string sqlstr = "INSERT INTO PEAKS" + std::to_string(table_cnt) + "(ID,MZ,INTENSITY, RETENTIONTIME, COLOR) VALUES (?,?, ?, ?, ?); ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_, sql_, sqlstr.length(), &stmt_peak_ms1_only, 0);
};
void mzMLReader::closeInsertStmt() {
  sqlite3_finalize(stmt_sp);
  sqlite3_finalize(stmt_peak);
  sqlite3_finalize(stmt_level_pair);
  sqlite3_finalize(stmt_sp_sum_update);
};
void mzMLReader::closeInsertStmtMs1Only() {
  sqlite3_finalize(stmt_peak_ms1_only);
};
void mzMLReader::insertSpStmt(int scan_index, std::string scan, double retention_time, double ion_time, int scan_level, double prec_mz, int prec_charge, double prec_inte, double peaks_int_sum, int next, int prev) {
  sqlite3_reset(stmt_sp);
  sqlite3_bind_int(stmt_sp,1,scan_index);
  sqlite3_bind_int(stmt_sp,2,std::stoi(scan));
  sqlite3_bind_double(stmt_sp,3,retention_time);
  sqlite3_bind_double(stmt_sp,4,ion_time);
  sqlite3_bind_int(stmt_sp,5,scan_level);
  sqlite3_bind_double(stmt_sp,6,prec_mz);
  sqlite3_bind_int(stmt_sp,7,prec_charge);
  sqlite3_bind_double(stmt_sp,8,prec_inte);
  sqlite3_bind_double(stmt_sp,9,peaks_int_sum);
  sqlite3_bind_int(stmt_sp,10,next);
  sqlite3_bind_int(stmt_sp,11,prev);
  int r = sqlite3_step(stmt_sp);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_) << std::endl;
  }
};
void mzMLReader::insertScanLevelPairStmt(int scan_level_one, int scan_level_two) {
  sqlite3_reset(stmt_level_pair);
  sqlite3_bind_int(stmt_level_pair,1,scan_level_one);
  sqlite3_bind_int(stmt_level_pair,2,scan_level_two);
  int r = sqlite3_step(stmt_level_pair);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_) << std::endl;
  }
};
void mzMLReader::updateSpStmt(int current_id, int prev_id) {
  sqlite3_reset(stmt_update);
  sqlite3_bind_int(stmt_update,1,current_id);
  sqlite3_bind_int(stmt_update,2,prev_id);
  int r = sqlite3_step(stmt_update);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_) << std::endl;
  }
};
void mzMLReader::updateSpSumStmt(int current_id, double peaks_int_sum) {
  sqlite3_reset(stmt_sp_sum_update);
  sqlite3_bind_double(stmt_sp_sum_update,1,peaks_int_sum);
  sqlite3_bind_int(stmt_sp_sum_update,2,current_id);
  int r = sqlite3_step(stmt_sp_sum_update);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_) << std::endl;
  }
}
void mzMLReader::insertPeakStmt(int peak_index, int scan_index, double intensity, double mz, double retention_time) {
  sqlite3_reset(stmt_peak);
  sqlite3_bind_int(stmt_peak,1,peak_index);
  sqlite3_bind_int(stmt_peak,2,scan_index);
  sqlite3_bind_double(stmt_peak,4,intensity);
  sqlite3_bind_double(stmt_peak,3,mz);
  sqlite3_bind_double(stmt_peak,5,retention_time);
  int r = sqlite3_step(stmt_peak);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_) << std::endl;
  }
};
void mzMLReader::insertPeakStmtMs1(int peak_index, double intensity, double mz, double retention_time, int color) {
  sqlite3_reset(stmt_peak_ms1_only);
  sqlite3_bind_int(stmt_peak_ms1_only,1,peak_index);
  sqlite3_bind_double(stmt_peak_ms1_only,3,intensity);
  sqlite3_bind_double(stmt_peak_ms1_only,2,mz);
  sqlite3_bind_double(stmt_peak_ms1_only,4,retention_time);
  sqlite3_bind_int(stmt_peak_ms1_only,5,color);
  int r = sqlite3_step(stmt_peak_ms1_only);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_) << std::endl;
  }
};
void mzMLReader::createIndex() {
  std::string sqlstr = "CREATE INDEX scan_index ON SPECTRA (SCAN);";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Scan_index created successfully" << std::endl;
  }
  sqlstr = "CREATE INDEX id_index ON SPECTRA (ID);";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "id_index created successfully" << std::endl;
  }
  sqlstr = "CREATE INDEX scanPairs_index ON ScanPairs (LevelOneScanID,LevelTwoScanID);";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "scanPairs_index created successfully" << std::endl;
  }
  sqlstr = "CREATE INDEX peak_index ON PEAKS (SPECTRAID);";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "peak_index created successfully" << std::endl;
  }
};
void mzMLReader::createLayerIndex(int table_cnt){
  std::string sqlstr = "CREATE INDEX ID_index_mem" + int2str(table_cnt) + " ON PEAKS" + int2str(table_cnt) + "(ID);";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    //std::cout << "ID_index_mem created successfully" << std::endl;
  }
}
/*
Use only one table.
Use only one table.
Use only one table.
Use only one table.
Use only one table.
*/

double mzMLReader::normalizeInte(std::vector<double> *normalization_data){
  double target_range = 100;
  double max = (*normalization_data)[1];
  double min = (*normalization_data)[0];
  double range = max - min;

  double log_base = exp((log(max) - log(min)) / target_range);

  (*normalization_data)[0] = log(min) / log(log_base);
  (*normalization_data)[1] = log(max) / log(log_base);

  return log_base;
}
void mzMLReader::setColor(){
  std::vector<double> normalization{Range.int_min, Range.int_max};
  double log_base = normalizeInte(&normalization);
  double max = normalization[1];
  double min = normalization[0];
  double val_span = max - min;
  
  for (size_t t = 0; t < all_ms1_peaks_.size(); t++) {
    peakProperties peak = all_ms1_peaks_[t];
    int color_code = -1;

    double intensity = log(peak.inte) / log(log_base);
    int idx = (int)(peak_color_.size() * (intensity-min)/val_span);

    if (idx < 0) {
      color_code = peak_color_[0];
    } 
    else if (idx >= peak_color_.size() -1) {
      color_code = peak_color_[peak_color_.size() -1];
    }
    else{
      color_code = peak_color_[idx];
    }
    all_ms1_peaks_[t].color = color_code;
  }
}
void mzMLReader::insertPeakToEachLayer(std::vector<peakProperties> *grid_ptr, int table_cnt){
  clock_t t1 = clock();
  for (int i = 0; i < grid_ptr->size(); i++){
    int peak_id = (*grid_ptr)[i].id;
    double mz = (*grid_ptr)[i].mz;
    double inte = (*grid_ptr)[i].inte;
    double rt = (*grid_ptr)[i].rt;
    int color = (*grid_ptr)[i].color;

    openInsertStmtMs1Only(table_cnt);
    insertPeakStmtMs1(peak_id, inte, mz, rt, color);
    closeInsertStmtMs1Only();
  }
  std::cout << peak_in_grid << " peaks insertion to PEAKS " << table_cnt << " finished: " << (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
}
void mzMLReader::assignPeakDataToGridBlocks(std::vector<peakProperties> *grid_ptr, int &table_cnt) {
  clock_t t1 = clock();

  if (peak_in_grid < Range.min_peaks) {
    Range.layer_count = table_cnt - 1;//previous table was the last table
    return;//end of recursion
  }
  resetRange();

  peak_in_grid = 0;
  int row_num = 1;
  int replaceCnt = 0;

  t1 = clock();
  std::sort(grid_ptr->begin(), grid_ptr->end(), sortByRt);

  std::vector<peakProperties> new_grid;
  std::vector<peakProperties> *new_grid_ptr = &new_grid;
  std::vector<peakProperties> single_row;

  for (size_t t = 0; t < grid_ptr->size(); t++) {
    if ((*grid_ptr)[t].rt < Range.rt_min + (Range.rt_size * row_num)) {
      single_row.push_back((*grid_ptr)[t]);
    }
    else {
      Grid.is_new_row = true;
      //reset m/z and intensity for each row
      Grid.cur_mz = Range.mz_min;
      Grid.cur_max_inte = 0;

      std::sort(single_row.begin(), single_row.end(), sortByMz);

      for (size_t u = 0; u < single_row.size(); u++) {
        //based on mz bin
        if (single_row[u].mz <= Grid.cur_mz){
          if (single_row[u].inte > Grid.cur_max_inte){
            if (new_grid_ptr->size() > 0 && Grid.is_new_row == false) {
              new_grid_ptr->pop_back();
            }
            new_grid_ptr->push_back(single_row[u]);
            updateRange(single_row[u]);
            //update highest intensity in this range
            Grid.cur_max_inte = single_row[u].inte;
          }
        }
        else {
          //update Range information
          updateRange(single_row[u]);
          new_grid_ptr->push_back(single_row[u]);
          Grid.cur_max_inte = single_row[u].inte;

          while (Grid.cur_mz < single_row[u].mz){
            Grid.cur_mz += Range.mz_size;
          }
        }
        Grid.is_new_row = false;
      }
      //move to next row
      row_num++;
      single_row.clear();//dont need to swap with empty vector since it will probably receive same number of elements each time
      single_row.push_back((*grid_ptr)[t]);//add the current peak so that it will be considered in the next evaluation    
    }
  }
  if (single_row.size() > 0) {
      Grid.is_new_row = true;
      //reset m/z and intensity for each row
      Grid.cur_mz = Range.mz_min;
      Grid.cur_max_inte = 0;

      std::sort(single_row.begin(), single_row.end(), sortByMz);

      for (size_t u = 0; u < single_row.size(); u++) {
        //based on mz bin
        if ((single_row)[u].mz <= Grid.cur_mz){
          if (single_row[u].inte > Grid.cur_max_inte){
            if (new_grid_ptr->size() > 0 && Grid.is_new_row == false) {
              new_grid_ptr->pop_back();
              replaceCnt++;
            }
            new_grid_ptr->push_back(single_row[u]);
            updateRange(single_row[u]);
            //update highest intensity in this range
            Grid.cur_max_inte = single_row[u].inte;
          }   
        }
        else {
          //update Range information
          updateRange(single_row[u]);
          new_grid_ptr->push_back(single_row[u]);
          Grid.cur_max_inte = single_row[u].inte;

          while (Grid.cur_mz < single_row[u].mz){
            Grid.cur_mz += Range.mz_size;
          }
        }
        Grid.is_new_row = false;
      }
      std::vector<peakProperties>().swap(single_row);
  }
  peak_in_grid = new_grid_ptr->size();
  table_cnt++;
  std::cout <<"assignment to PEAKS " << table_cnt << " finished: " << (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  createLayerTable(int2str(table_cnt));
  insertPeakToEachLayer(new_grid_ptr, table_cnt);
  SingleTableRange.count = peak_in_grid;
  insertConfigOneTable(SingleTableRange);
  std::vector<peakProperties>().swap(*grid_ptr);//swap with empty vector to release memory for old vector

  Range.mz_size = Range.mz_size * Range.mz_scale;
  Range.rt_size = Range.rt_size * Range.rt_scale;

  assignPeakDataToGridBlocks(new_grid_ptr, table_cnt);//start over with next table
}
void mzMLReader::insertPeakDataToGridBlocks(int table_cnt){
  peak_in_grid = all_ms1_peaks_.size();
  clock_t t1 = clock();
  std::vector<peakProperties> *grid_ptr = &all_ms1_peaks_;

  resetRange();
  createLayerTable(int2str(table_cnt));
  SingleTableRange.count = peak_in_grid;
  insertPeakToEachLayer(grid_ptr, table_cnt);
  assignPeakDataToGridBlocks(grid_ptr, table_cnt);
}
void mzMLReader::insertPeaksToEachLayer(int table_cnt, int scan_id){
  std::string sqlstr = "INSERT INTO PEAKS" + int2str(table_cnt) + "(ID,MZ,INTENSITY,RETENTIONTIME,COLOR)" + 
  "SELECT * FROM PEAKS" + int2str(table_cnt - 1) + " WHERE ID=" + int2str(scan_id)+ ";";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_, sql_, callbackInsertPeak, db_, &z_err_msg_);     
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    //std::cout << "Operation done successfully - insertDataLayerTable" << std::endl;
  }
}

void mzMLReader::insertDataLayerTable(){
  //output : PEAKSn tables are created and data are inserted to each table.
  int table_cnt = 0;
  clock_t t1 = clock();
  insertPeakDataToGridBlocks(table_cnt);//peaks assigned to GRID.GRIDBLOCKS
  std::cout <<"insertPeakDataToGridBlocks finished: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
}
void mzMLReader::setRange(DataRange Tmp_range) {
  Range = Tmp_range;
}
void mzMLReader::resetRange() {
  SingleTableRange.mz_max = 0;
  SingleTableRange.mz_min = 99999;
  SingleTableRange.int_max = 0;
  SingleTableRange.int_min = 99999;
  SingleTableRange.rt_max = 0;
  SingleTableRange.rt_min = 99999;
}
void mzMLReader::insertConfigOneTable(DataRange Range) {
  /* Create SQL statement */
  std::string sqlstr = "INSERT INTO CONFIG (MZMIN,MZMAX,RTMIN,RTMAX,INTMIN,INTMAX,COUNT) VALUES (" +
    num2str(Range.mz_min) + ", " + num2str(Range.mz_max) + ", " + num2str(Range.rt_min) + ", " + num2str(Range.rt_max) + ", " +
    num2str(Range.int_min) + ", " + num2str(Range.int_max) + ", " + int2str(Range.count)+ " ); ";
  sql_ = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }
};
void mzMLReader::createLayerTable(std::string num) {
  /* Create SQL statement */
  std::string sqlstr = "CREATE TABLE PEAKS" + num + "("  \
       "ID  INTEGER PRIMARY KEY     NOT NULL," \
       "MZ              REAL     NOT NULL," \
       "INTENSITY       REAL     NOT NULL," \
       "RETENTIONTIME     REAL     NOT NULL," \
       "COLOR     TINYINT     NOT NULL);";
  sql_ = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Table created successfully\n");
    //std::cout << "Table PEAKS" + num +" created successfully" << std::endl;
  }
};
void mzMLReader::createIndexLayerTable() {
  //for all layer tables, create index
  //need intensity index
  for (int i = 0; i < Range.layer_count; i++){
    std::string sqlstr = "CREATE INDEX rtmz_index" + num2str(i) + " ON PEAKS" + num2str(i) + " (RETENTIONTIME, MZ);";
    sql_ = (char *)sqlstr.c_str();
    rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
    if( rc_ != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
      sqlite3_free(z_err_msg_);
    }else{
      // fprintf(stdout, "Records created successfully\n");
      //std::cout << "Retention time_index created successfully" << std::endl;
    }
  }
};

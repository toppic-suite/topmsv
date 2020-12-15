#include "mzMLReader.hpp" 
#include <string.h>

DataRange Range;
GridProperties Grid;
sqlite3_stmt *stmt_sp;
sqlite3_stmt *stmt_peak;
sqlite3_stmt *stmt_peak_ms1_only;
sqlite3_stmt *stmt_peak_in_memory;
sqlite3_stmt *stmt_level_pair;
sqlite3_stmt *stmt_update;
sqlite3_stmt *stmt_sp_sum_update;

int peak_in_grid = 0;
int peak_int_rank = 0;

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
int callbackUpdateData(void *ptr, int argc, char **argv, char **az_col_name){//method using peak count 
  std::vector<double> *normalization_ptr = reinterpret_cast<std::vector<double>*> (ptr);
  std::vector<double> normalization = *normalization_ptr;
  double max = normalization[1];
  double min = normalization[0];
  double val_span = max - min;
  double log_base = normalization[2];
  double intensity = log(std::stod(argv[2])) / log(log_base);
  mzMLReader reader;

  std::string color = "NONE";
  
  int idx = (int)(reader.peak_color_.size() * (intensity-min)/val_span);

  if (idx < 0) {
    color = reader.peak_color_[0];
  } 
  else if (idx >= reader.peak_color_.size() -1) {
    color = reader.peak_color_[reader.peak_color_.size() -1];
  }
  else{
    color = reader.peak_color_[idx];
  }
  //insert to PEAKS0 table at disk
  reader.insertPeakStmtMs1(std::stoi(argv[0]), std::stod(argv[2]),std::stod(argv[1]), std::stod(argv[3]), color);
}
int callbackConvertData(void *not_used, int argc, char **argv, char **az_col_name){
  /*input : row from PEAKS0 table, with a column structure as above
    output : GRID.GRIDBLOCKS is filled with peaks assigned to a grid for PEAKS1 (second largest) table*/

  double mz_range = Range.mz_max - Range.mz_min;//range of mz in mzmML
  double rt_range = Range.rt_max - Range.rt_min;
  int grid_width = floor(mz_range / Range.mz_size);
  int grid_height = floor(rt_range / Range.rt_size);

  int x_index = floor(((std::stod(argv[1]) - Range.mz_min) * (grid_width - 1))/ mz_range);
  int y_index = floor(((std::stod(argv[3]) - Range.rt_min) * (grid_height - 1))/ rt_range);
/*
  ofstream output("GridLog.txt");
  if(output.is_open()){
    output << "grid_width:" << grid_width << " grid_height: " << grid_height << "\n" << std::endl;
    output << "x_index:" << x_index << " y_index: " << y_index << "\n" << std::endl;
  }
  output.close();
*/
  if (x_index < Grid.grid_blocks.size() && y_index < Grid.grid_blocks[0].size()){
    /*see if the grid block at [xIndex][yIndex] already has a peak.
    if it has a peak, the value at the index is FALSE. If it does not have a peak yet, the value is TRUE.
    if TRUE, insert the peak into the corresponding table and set the value at [xIndex][yIndex] to be FALSE*/
  
    if (Grid.grid_blocks[x_index][y_index][0] < 0){//if gridBlock does not have a peak yet
      //store the intensity and ID
      Grid.grid_blocks[x_index][y_index][0] = std::stoi(argv[0]);
      Grid.grid_blocks[x_index][y_index][1] = std::stod(argv[2]);
      Grid.grid_blocks[x_index][y_index][2] = std::stoi(argv[1]);//mz
      Grid.grid_blocks[x_index][y_index][3] = std::stod(argv[3]);//inte
      peak_in_grid++;
    }
    else{
      //compare intensity
      if (std::stod(argv[2]) > Grid.grid_blocks[x_index][y_index][1]){
        Grid.grid_blocks[x_index][y_index][0] = std::stoi(argv[0]);
        Grid.grid_blocks[x_index][y_index][1] = std::stod(argv[2]);
        Grid.grid_blocks[x_index][y_index][2] = std::stoi(argv[1]);//mz
        Grid.grid_blocks[x_index][y_index][3] = std::stod(argv[3]);//inte   
      } 
    }
  }
  else{
    //if xIndex or yIndex are out of range, compare with the last index in GRIDBLOCKS
    if (x_index >= Grid.grid_blocks.size()){
      x_index = Grid.grid_blocks.size() -1;
    }
    if (y_index >= Grid.grid_blocks[0].size()){
      y_index = Grid.grid_blocks[0].size() -1;
    }
    if (Grid.grid_blocks[x_index][y_index][0] < 0){//if gridBlock does not have a peak yet
      //store the intensity and ID
      Grid.grid_blocks[x_index][y_index][0] = std::stoi(argv[0]);
      Grid.grid_blocks[x_index][y_index][1] = std::stod(argv[2]);
      Grid.grid_blocks[x_index][y_index][2] = std::stoi(argv[1]);//mz
      Grid.grid_blocks[x_index][y_index][3] = std::stod(argv[3]);//inte

      peak_in_grid++;
    }
    else{
      //compare intensity
      if (std::stod(argv[2]) > Grid.grid_blocks[x_index][y_index][1]){
        Grid.grid_blocks[x_index][y_index][0] = std::stoi(argv[0]);
        Grid.grid_blocks[x_index][y_index][1] = std::stod(argv[2]);
        Grid.grid_blocks[x_index][y_index][2] = std::stoi(argv[1]);//mz
        Grid.grid_blocks[x_index][y_index][3] = std::stod(argv[3]);//inte
      }
    }
  }
  //GRIDBLOCKS now should be having one peak for each grid, unless there was no peak in that grid mz and rt range
  return 0;
}

mzMLReader::mzMLReader() {
   data_ = (char*)("Callback function called");
};
void mzMLReader::setNameInMemory(std::string file_name) {
   file_name.insert(file_name.length() - 5, "_3D"); 
   database_name_in_memory_ = file_name.replace(file_name.length() - 4,4,"memory");
};
void mzMLReader::setName(std::string file_name) {
   database_name_ = file_name.replace(file_name.length() - 4,4,"db");
};
void mzMLReader::openDatabaseInMemory(std::string file_name) {
   setName(file_name);
   /* Open database */
   rc_ = sqlite3_open(":memory:", &db_in_memory_);
   if( rc_ ){
      // fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
      std::cout << "Can't open database: " << sqlite3_errmsg(db_) << std::endl;
      exit(0);
   }else{
      //fprintf(stdout, "Opened database successfully\n");
      std::cout << "Opened in-memory database successfully"<< std::endl;
   }
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
void mzMLReader::closeDatabaseInMemory() {
   sqlite3_close(db_in_memory_);
};
void mzMLReader::creatTable() {
   /* Create SQL statement */
   sql_ = (char*)("CREATE TABLE SPECTRA("  \
         "ID INT PRIMARY KEY      NOT NULL," \
         "SCAN           INT      NOT NULL," \
         "RETENTIONTIME  REAL     NOT NULL," \
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
         "ID INT PRIMARY KEY     NOT NULL," \
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
  /* Create SQL statement */
   sql_ = (char*)("CREATE TABLE PEAKS0("  \
         "ID INT PRIMARY KEY     NOT NULL," \
         "MZ            REAL     NOT NULL," \
         "INTENSITY     REAL     NOT NULL," \
         "RETENTIONTIME     REAL     NOT NULL," \
         "COLOR     TEXT);");

   /* Execute SQL statement */
   rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
   if( rc_ != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
      sqlite3_free(z_err_msg_);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       std::cout << "Table PEAKS0 created successfully" << std::endl;
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
void mzMLReader::creatTableInMemory() {
   /* Create SQL statement */
   sql_ = (char*)("CREATE TABLE PEAKS0("  \
         "ID INT PRIMARY KEY     NOT NULL," \
         "MZ            REAL     NOT NULL," \
         "INTENSITY     REAL     NOT NULL," \
         "RETENTIONTIME     REAL     NOT NULL," \
         "COLOR     TEXT);");

   /* Execute SQL statement */
   rc_ = sqlite3_exec(db_in_memory_, sql_, callback, 0, &z_err_msg_);
   if( rc_ != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
      sqlite3_free(z_err_msg_);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       std::cout << "in memory Table PEAKS0 created successfully" << std::endl;
   }
};
void mzMLReader::getScanRange() {
  /* Create SQL statement */
  sql_ = (char*)("SELECT MIN(SCAN),MAX(SCAN) FROM SPECTRA;");
  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callbackRange, (void*)data_, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << db_in_memory_ << std::endl;
    sqlite3_free(db_in_memory_);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << "\t";
  std::cout << std::endl;
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
void mzMLReader::beginTransactionInMemory() {
  std::string sqlstr = "BEGIN;";
  sql_ = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_in_memory_, sql_, callback, 0, &z_err_msg_);
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
void mzMLReader::endTransactionInMemory() {
  std::string sqlstr = "COMMIT;";
  sql_ = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_in_memory_, sql_, callback, 0, &z_err_msg_);
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
  std::string sqlstr = "INSERT INTO SPECTRA (ID,SCAN,RETENTIONTIME,SCANLEVEL,PREC_MZ,PREC_CHARGE,PREC_INTE,PEAKSINTESUM,NEXT,PREV) VALUES (? ,? ,?, ?, ?, ?, ?, ?, ?, ?); ";
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
void mzMLReader::openInsertStmtMs1Only() {
  std::string sqlstr = "INSERT INTO PEAKS0 (ID,MZ,INTENSITY, RETENTIONTIME, COLOR) VALUES (?,?, ?, ?, ?); ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_, sql_, sqlstr.length(), &stmt_peak_ms1_only, 0);
};
void mzMLReader::openInsertStmtInMemory() {
  std::string sqlstr = "INSERT INTO PEAKS0 (ID,MZ,INTENSITY, RETENTIONTIME, COLOR) VALUES (?,?, ?, ?, ?); ";
  sql_ = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db_in_memory_, sql_, sqlstr.length(), &stmt_peak_in_memory, 0);
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
void mzMLReader::closeInsertStmtInMemory() {
  sqlite3_finalize(stmt_peak_in_memory);
};
void mzMLReader::insertSpStmt(int scan_index, std::string scan, double retention_time, int scan_level, double prec_mz, int prec_charge, double prec_inte, double peaks_int_sum, int next, int prev) {
  sqlite3_reset(stmt_sp);
  sqlite3_bind_int(stmt_sp,1,scan_index);
  sqlite3_bind_int(stmt_sp,2,std::stoi(scan));
  sqlite3_bind_double(stmt_sp,3,retention_time);
  sqlite3_bind_int(stmt_sp,4,scan_level);
  sqlite3_bind_double(stmt_sp,5,prec_mz);
  sqlite3_bind_int(stmt_sp,6,prec_charge);
  sqlite3_bind_double(stmt_sp,7,prec_inte);
  sqlite3_bind_double(stmt_sp,8,peaks_int_sum);
  sqlite3_bind_int(stmt_sp,9,next);
  sqlite3_bind_int(stmt_sp,10,prev);
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
void mzMLReader::insertPeakStmtMs1(int peak_index, double intensity, double mz, double retention_time, std::string color) {
  char *color_code = (char *)color.c_str();
  sqlite3_reset(stmt_peak_ms1_only);
  sqlite3_bind_int(stmt_peak_ms1_only,1,peak_index);
  sqlite3_bind_double(stmt_peak_ms1_only,3,intensity);
  sqlite3_bind_double(stmt_peak_ms1_only,2,mz);
  sqlite3_bind_double(stmt_peak_ms1_only,4,retention_time);
  sqlite3_bind_text(stmt_peak_ms1_only,5,color_code, color.size(), SQLITE_TRANSIENT);
  int r = sqlite3_step(stmt_peak_ms1_only);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_) << std::endl;
  }
};
void mzMLReader::insertPeakStmtInMemory(int peak_index, int scanIndex, double intensity, double mz, double retention_time, std::string color) {
  char *color_code = (char *)color.c_str();
  sqlite3_reset(stmt_peak_in_memory);
  sqlite3_bind_int(stmt_peak_in_memory,1,peak_index);
  sqlite3_bind_double(stmt_peak_in_memory,3,intensity);
  sqlite3_bind_double(stmt_peak_in_memory,2,mz);
  sqlite3_bind_double(stmt_peak_in_memory,4,retention_time);
  sqlite3_bind_text(stmt_peak_in_memory,5,color_code, color.size(), SQLITE_TRANSIENT);
  int r = sqlite3_step(stmt_peak_in_memory);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db_in_memory_) << std::endl;
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
void mzMLReader::createIndexOnIdOnly(){
  std::string sqlstr = "CREATE INDEX scanID_index ON PEAKS0 (ID);";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "ID_index created successfully" << std::endl;
  }
}
void mzMLReader::createIndexOnIdOnlyInMemory(){
  std::string sqlstr = "CREATE INDEX ID_index_mem ON PEAKS0 (ID);";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_in_memory_, sql_, 0, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "ID_index_mem created successfully" << std::endl;
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
  std::string sqlstr = "SELECT * FROM PEAKS0;";
  std::vector<double> normalization_data{Range.int_min, Range.int_max};

  double log_base = normalizeInte(&normalization_data);

  normalization_data.push_back(log_base);

  openInsertStmtMs1Only();

  std::vector<double> *max_min_ptr = &normalization_data;
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_in_memory_, sql_, callbackUpdateData, max_min_ptr, &z_err_msg_);//after this function, gridBlocks has a peak for each grid
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    //std::cout << "Operation done successfully - insertPreakDataToGridBlocks" << std::endl;
  }
  closeInsertStmtMs1Only();
}

void mzMLReader::resetRange(){
  Range.mz_min = 99999;
  Range.mz_max = 0;
  Range.rt_min = 99999;
  Range.rt_max = 0;
  Range.int_min = 99999;
  Range.int_max = 0;
  Range.count = 0;
}
void mzMLReader::insertPeakDataToGridBlocks(){
  std::string sqlstr = "SELECT * FROM PEAKS0;";
  sql_ = (char *)sqlstr.c_str();
  rc_ = sqlite3_exec(db_in_memory_, sql_, callbackConvertData, db_in_memory_, &z_err_msg_);//after this function, gridBlocks has a peak for each grid
  if( rc_ != SQLITE_OK ){
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    //std::cout << "Operation done successfully - insertPreakDataToGridBlocks" << std::endl;
  }
}
void mzMLReader::createSmallestTable(int &table_cnt, std::vector<int> &prev_peak_id){
  /*input : peak ID of the current smallest table
    output : one more table created or not, based on how big the currnet smallest table is*/
  if (prev_peak_id.size() > Range.min_peaks * 2){
    resetRange();
    //if current smallest table is too large
    int interval = int(prev_peak_id.size() / Range.min_peaks);//which value to pick to make this new table to have peaks close to RANGE.MINPEAKS

    int cnt = 0;
    createLayerTable(int2str(table_cnt));
    beginTransaction();

    for (int i = 0; i < prev_peak_id.size(); i = i + interval){
      insertPeaksToEachLayer(table_cnt, prev_peak_id[i]);
      cnt++;
    }
    Range.count = cnt;
    insertConfigOneTable();

    endTransaction();
    table_cnt++;
  }
}
void mzMLReader::assignDataToGrid(int table_cnt,std::vector<int> &selected_peak_id){
  /*input : number of table to be created (PEAKS1, PEAKS2...) and a vector containing peak ID to insert to the table
  output : vector is filled with peak IDs to insert*/
 
  int x = 0;
  int y = 0; 

  //index of 2d vector
  int x_range = pow(Range.mz_scale, table_cnt - 1);
  int y_range = pow(Range.rt_scale, table_cnt - 1);
 
  while (y < Grid.grid_blocks[0].size()){
    while (x < Grid.grid_blocks.size()){
      double highest_intensity = 0;
      int highest_peak_id = -1;

      for (int cur_x = x; cur_x < x + x_range && cur_x < Grid.grid_blocks.size(); cur_x++){
        for (int cur_y = y; cur_y < y + y_range && cur_y < Grid.grid_blocks[0].size(); cur_y++){
          //check intensity
          if (Grid.grid_blocks[cur_x][cur_y][1] > highest_intensity){
            highest_intensity =  Grid.grid_blocks[cur_x][cur_y][1];
            highest_peak_id = Grid.grid_blocks[cur_x][cur_y][0];

            double mz = Grid.grid_blocks[cur_x][cur_y][2];
            double rt = Grid.grid_blocks[cur_x][cur_y][3];
            //to set information to add to CONFIG table
            
            if (mz > Range.mz_max){
              Range.mz_max = mz;
            }
            else if (mz < Range.mz_min){
              Range.mz_min = mz;
            };
            if (highest_intensity > Range.int_max){
              Range.int_max = highest_intensity;
            }
            else if (highest_intensity < Range.int_min){
              Range.int_min = highest_intensity;
            };
            if (rt > Range.rt_max){
              Range.rt_max = rt;
            }
            else if (rt < Range.rt_min){
              Range.rt_min = rt;
            };
          }
        }
      }
      if (highest_peak_id >= 0){
        //insert and reset
        selected_peak_id.push_back(highest_peak_id);
      }
      x = x + x_range;
    }
    //moving to next row in grid
    y = y + y_range;
    x = 0;
  }
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
  /*output : PEAKSn tables are created and data are inserted to each table.*/
  double mz_range = Range.mz_max - Range.mz_min;//range of mz in mzmML
  int grid_width = floor(mz_range / Range.mz_size);

  double rt_range = Range.rt_max - Range.rt_min;//range of rt in mzmML
  int grid_height = floor(rt_range / Range.rt_size);

  //try catch if grid too big
  
  Grid.grid_blocks = std::vector<std::vector<std::vector<double> > > (grid_width, std::vector<std::vector<double> >(grid_height, std::vector<double>({-1, -1, -1, -1})));  

  clock_t t1 = clock();
  insertPeakDataToGridBlocks();//peaks assigned to GRID.GRIDBLOCKS
  closeDatabaseInMemory();//close in-memory database. local disk db is still open.

  std::cout <<"insertPeakDataToGridBlocks finished: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  int peak_cnt = peak_in_grid;//number of peaks in grid blocks (exclude empty grid blocks);
  int table_cnt = 1;

  std::vector<int> prev_peak_id;//peakID in previous table

  while (peak_cnt >= Range.min_peaks){
    if (table_cnt == 1){
      resetRange();
      beginTransaction();

      Range.count = peak_cnt;

      insertConfigOneTable();
      createLayerTable(int2str(table_cnt));
      
      for (int a = 0; a < Grid.grid_blocks.size(); a++){
        for (int b = 0; b < Grid.grid_blocks[a].size(); b++){
          int scan_id = Grid.grid_blocks[a][b][0];
          if (scan_id > 0){
            prev_peak_id.push_back(scan_id);
            insertPeaksToEachLayer(table_cnt, scan_id);

            double inte = Grid.grid_blocks[a][b][1];
            double mz = Grid.grid_blocks[a][b][2];
            double rt = Grid.grid_blocks[a][b][3];
            //to set information to add to CONFIG table
            
            if (mz > Range.mz_max){
              Range.mz_max = mz;
            }
            else if (mz < Range.mz_min){
              Range.mz_min = mz;
            };
            if (inte > Range.int_max){
              Range.int_max = inte;
            }
            else if (inte < Range.int_min){
              Range.int_min = inte;
            };
            if (rt > Range.rt_max){
              Range.rt_max = rt;
            }
            else if (rt < Range.rt_min){
              Range.rt_min = rt;
            };
          }
        }
      }
      endTransaction();
      table_cnt++;
    }
    else if (table_cnt > 1){
      resetRange();

      std::vector<int> selected_peak_id;//peaks to insert to the table

      assignDataToGrid(table_cnt, selected_peak_id);

      peak_cnt = selected_peak_id.size();
      
      if (peak_cnt >= Range.min_peaks){
        beginTransaction();
        Range.count = peak_cnt;
        insertConfigOneTable();

        prev_peak_id = selected_peak_id;
        createLayerTable(int2str(table_cnt));
        
        for (int i = 0; i < selected_peak_id.size(); i++){
          insertPeaksToEachLayer(table_cnt, selected_peak_id[i]);
        }
        endTransaction();

        table_cnt++;
      }
      else{
        createSmallestTable(table_cnt, prev_peak_id);//create one more table if current smallest table is still big
      }
    } 
    Range.layer_count = table_cnt;
  }
}
void mzMLReader::setRange(DataRange Tmp_range) {
  Range = Tmp_range;
}
void mzMLReader::insertConfigOneTable() {
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
       "ID  INT PRIMARY KEY     NOT NULL," \
       "MZ              REAL     NOT NULL," \
       "INTENSITY       REAL     NOT NULL," \
       "RETENTIONTIME     REAL     NOT NULL," \
       "COLOR     TEXT     NOT NULL);";
  sql_ = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc_ = sqlite3_exec(db_, sql_, callback, 0, &z_err_msg_);
  if( rc_ != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc_ << "-" << z_err_msg_ << std::endl;
    sqlite3_free(z_err_msg_);
  }else{
    // fprintf(stdout, "Table created successfully\n");
    //std::cout << "One table PEAKS" + num +" created successfully" << std::endl;
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

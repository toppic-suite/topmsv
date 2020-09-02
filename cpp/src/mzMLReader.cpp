#include "mzMLReader.hpp" 
#include <string.h>

Range RANGE;
Grid GRID;
sqlite3_stmt *stmtSp;
sqlite3_stmt *stmtPeak;
sqlite3_stmt *stmtPeakMs1Only;
sqlite3_stmt *stmtPeakInMemory;
sqlite3_stmt *stmtLevelPair;
sqlite3_stmt *stmtUpdate;
sqlite3_stmt *stmtSpSumUpdate;

int peak_in_grid = 0;
int peak_inte_rank = 0;

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

int callback(void *NotUsed, int argc, char **argv, char **azColName) {
  int i;
  for(i=0; i<argc; i++){
    // printf("%s = %s\n", azColName[i], argv[i] ? argv[i] : "NULL");
    std::cout << azColName[i] << " = " << (argv[i] ? argv[i] : "NULL") << std::endl;
  }
  // printf("\n");
  std::cout << std::endl;
  return 0;
};
int callbackRange(void *NotUsed, int argc, char **argv, char **azColName) {
  for (int i = 0; i < argc; i++) {
    if (i > 1 && i < 4) {
      std::cout << std::stod(argv[i])/60 << "\t"; 
    } else {
      std::cout << argv[i] << "\t"; 
    }
  }
  return 0;
};
int callbackPeakFromScan(void *NotUsed, int argc, char**argv, char **azColName) {
  std::cout << argv[0] << "," << argv[1] << std::endl ;
  return 0;
}
int callbackInsertPeak(void *NotUsed, int argc, char **argv, char **azColName) {
  sqlite3_reset(stmtPeak);
  sqlite3_bind_int(stmtPeak,1,std::stoi(argv[0]));
  sqlite3_bind_double(stmtPeak,2,std::stod(argv[1]));
  sqlite3_bind_double(stmtPeak,3,std::stod(argv[2]));
  sqlite3_bind_double(stmtPeak,4,std::stod(argv[3]));
  sqlite3_bind_text(stmtPeak,5, argv[4], strlen(argv[4]), SQLITE_TRANSIENT);

  int r = sqlite3_step(stmtPeak);
  if (r != SQLITE_DONE) {
    // std::cout << sqlite3_errmsg(db) << std::endl;
    std::cout << argv[0] << "," << argv[1] << "," << argv[2] << "," << argv[3] << "," << argv[4] << "\t" ;
    std::cout << "callbackInsertPeak error" << std::endl;
  }
  return 0;
};
int callbackUpdateData(void *ptr, int argc, char **argv, char **azColName){//method using peak count 
   /*input : row from PEAKS0 table*/
  std::vector<int> *intervalPtr = reinterpret_cast<std::vector<int>*> (ptr);
  std::vector<int> interval = *intervalPtr;

  mzMLReader reader;

  std::string color = "NONE";
  
  if (peak_inte_rank > interval[0]){
    for (int i = 1; i < interval.size(); i++){
      if (peak_inte_rank < interval[i]){
        color = reader.peakColor[i];  
        break;
      }
    }
  }
  else{
    color = reader.peakColor[0];
  } 

  if (color == "NONE"){
    //when a peak is higher than the last interval --> should be assigned the highest intensity color
    color = reader.peakColor[reader.peakColor.size() - 1];
  }
  //insert to PEAKS0 table at disk
  reader.insertPeakStmtMs1(std::stoi(argv[0]), std::stod(argv[2]),std::stod(argv[1]), std::stod(argv[3]), color);

  peak_inte_rank++;
}
int callbackConvertData(void *NotUsed, int argc, char **argv, char **azColName){
  /*input : row from PEAKS0 table, with a column structure as above
    output : GRID.GRIDBLOCKS is filled with peaks assigned to a grid for PEAKS1 (second largest) table*/

  double mz_range = RANGE.MZMAX - RANGE.MZMIN;//range of mz in mzmML
  double rt_range = RANGE.RTMAX - RANGE.RTMIN;
  int grid_width = floor(mz_range / RANGE.MZSIZE);
  int grid_height = floor(rt_range / RANGE.RTSIZE);

  int xindex = floor(((std::stod(argv[1]) - RANGE.MZMIN) * (grid_width - 1))/ mz_range);
  int yindex = floor(((std::stod(argv[3]) - RANGE.RTMIN) * (grid_height - 1))/ rt_range);

  if (xindex < GRID.GRIDBLOCKS.size() && yindex < GRID.GRIDBLOCKS[0].size()){
    /*see if the grid block at [xIndex][yIndex] already has a peak.
    if it has a peak, the value at the index is FALSE. If it does not have a peak yet, the value is TRUE.
    if TRUE, insert the peak into the corresponding table and set the value at [xIndex][yIndex] to be FALSE*/
  
    if (GRID.GRIDBLOCKS[xindex][yindex][0] < 0){//if gridBlock does not have a peak yet
      //store the intensity and ID
      GRID.GRIDBLOCKS[xindex][yindex][0] = std::stoi(argv[0]);
      GRID.GRIDBLOCKS[xindex][yindex][1] = std::stod(argv[2]);
      GRID.GRIDBLOCKS[xindex][yindex][2] = std::stoi(argv[1]);//mz
      GRID.GRIDBLOCKS[xindex][yindex][3] = std::stod(argv[3]);//inte
      peak_in_grid++;
    }
    else{
      //compare intensity
      if (std::stod(argv[2]) > GRID.GRIDBLOCKS[xindex][yindex][1]){
        GRID.GRIDBLOCKS[xindex][yindex][0] = std::stoi(argv[0]);
        GRID.GRIDBLOCKS[xindex][yindex][1] = std::stod(argv[2]);
        GRID.GRIDBLOCKS[xindex][yindex][2] = std::stoi(argv[1]);//mz
        GRID.GRIDBLOCKS[xindex][yindex][3] = std::stod(argv[3]);//inte   
      } 
    }
  }
  else{
    //if xIndex or yIndex are out of range, compare with the last index in GRIDBLOCKS
    if (xindex >= GRID.GRIDBLOCKS.size()){
      xindex = GRID.GRIDBLOCKS.size() -1;
    }
    if (yindex >= GRID.GRIDBLOCKS[0].size()){
      yindex = GRID.GRIDBLOCKS[0].size() -1;
    }
    if (GRID.GRIDBLOCKS[xindex][yindex][0] < 0){//if gridBlock does not have a peak yet
      //store the intensity and ID
      GRID.GRIDBLOCKS[xindex][yindex][0] = std::stoi(argv[0]);
      GRID.GRIDBLOCKS[xindex][yindex][1] = std::stod(argv[2]);
      GRID.GRIDBLOCKS[xindex][yindex][2] = std::stoi(argv[1]);//mz
      GRID.GRIDBLOCKS[xindex][yindex][3] = std::stod(argv[3]);//inte

      peak_in_grid++;
    }
    else{
      //compare intensity
      if (std::stod(argv[2]) > GRID.GRIDBLOCKS[xindex][yindex][1]){
        GRID.GRIDBLOCKS[xindex][yindex][0] = std::stoi(argv[0]);
        GRID.GRIDBLOCKS[xindex][yindex][1] = std::stod(argv[2]);
        GRID.GRIDBLOCKS[xindex][yindex][2] = std::stoi(argv[1]);//mz
        GRID.GRIDBLOCKS[xindex][yindex][3] = std::stod(argv[3]);//inte
      }
    }
  }
  //GRIDBLOCKS now should be having one peak for each grid, unless there was no peak in that grid mz and rt range
  return 0;
}

mzMLReader::mzMLReader() {
   data = (char*)("Callback function called");
};
void mzMLReader::setNameInMemory(std::string fileName) {
   fileName.insert(fileName.length() - 5, "_3D"); 
   databaseNameInMemory = fileName.replace(fileName.length() - 4,4,"memory");
  // std::cout << "databaseName" << databaseName << std::endl;
};
void mzMLReader::setName(std::string fileName) {
   databaseName = fileName.replace(fileName.length() - 4,4,"db");
  // std::cout << "databaseName" << databaseName << std::endl;
};
void mzMLReader::openDatabaseInMemory(std::string fileName) {
   setName(fileName);
   /* Open database */
   rc = sqlite3_open(":memory:", &dbInMemory);
   if( rc ){
      // fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
      std::cout << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
      exit(0);
   }else{
      //fprintf(stdout, "Opened database successfully\n");
      std::cout << "Opened in-memory database successfully"<< std::endl;
   }
};
void mzMLReader::openDatabase(std::string fileName) {
   setName(fileName);
   /* Open database */
   rc = sqlite3_open((char*)databaseName.c_str(), &db);
   if( rc ){
      // fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
      std::cout << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
      exit(0);
   }else{
      // fprintf(stdout, "Opened database successfully\n");
      // std::cout << "Opened database successfully"<< std::endl;
   }
};
void mzMLReader::closeDatabase() {
   sqlite3_close(db);
};
void mzMLReader::closeDatabaseInMemory() {
   sqlite3_close(dbInMemory);
};
void mzMLReader::creatTable() {
   /* Create SQL statement */
   sql = (char*)("CREATE TABLE SPECTRA("  \
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
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
      // std::cout << "Table SPECTRA created successfully" << std::endl;
   }

   /* Create SQL statement */
   sql = (char*)("CREATE TABLE PEAKS("  \
         "ID INT PRIMARY KEY     NOT NULL," \
         "SPECTRAID     INT      NOT NULL REFERENCES SPEACTRA(ID)," \
         "MZ            REAL     NOT NULL," \
         "INTENSITY     REAL     NOT NULL," \
         "RETENTIONTIME     REAL     NOT NULL);");

   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       std::cout << "Table PEAKS created successfully" << std::endl;
   }
  /* Create SQL statement */
   sql = (char*)("CREATE TABLE PEAKS0("  \
         "ID INT PRIMARY KEY     NOT NULL," \
         "MZ            REAL     NOT NULL," \
         "INTENSITY     REAL     NOT NULL," \
         "RETENTIONTIME     REAL     NOT NULL," \
         "COLOR     TEXT);");

   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       std::cout << "Table PEAKS0 created successfully" << std::endl;
   }
  // create a table for levelOne and levelTwo pair
   /* Create SQL statement */
   sql = (char*)("CREATE TABLE ScanPairs("  \
         "LevelOneScanID     INT      NOT NULL REFERENCES SPECTRA(SCAN)," \
         "LevelTwoScanID     INT      NOT NULL REFERENCES SPECTRA(SCAN)," \
         "PRIMARY KEY (LevelOneScanID, LevelTwoScanID));");
   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       //std::cout << "Table ScanPairs created successfully" << std::endl;
   }
   /* Create SQL statement */
   sql = (char*)("CREATE TABLE CONFIG("  \
         "ID  INTEGER PRIMARY KEY     NOT NULL," \
         "MZMIN           REAL     NOT NULL," \
         "MZMAX           REAL     NOT NULL," \
         "RTMIN           REAL     NOT NULL," \
         "RTMAX           REAL     NOT NULL," \
         "INTMIN          REAL     NOT NULL," \
         "INTMAX          REAL     NOT NULL," \
         "COUNT           INT     NOT NULL);");

   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
     std::cout << sql << std::endl;
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
      std::cout << "One table CONFIG created successfully" << std::endl;
   }
};
void mzMLReader::creatTableInMemory() {
   /* Create SQL statement */
   sql = (char*)("CREATE TABLE PEAKS0("  \
         "ID INT PRIMARY KEY     NOT NULL," \
         "MZ            REAL     NOT NULL," \
         "INTENSITY     REAL     NOT NULL," \
         "RETENTIONTIME     REAL     NOT NULL," \
         "COLOR     TEXT);");

   /* Execute SQL statement */
   rc = sqlite3_exec(dbInMemory, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
       std::cout << "in memory Table PEAKS0 created successfully" << std::endl;
   }
};
void mzMLReader::getScanRange() {
  /* Create SQL statement */
  sql = (char*)("SELECT MIN(SCAN),MAX(SCAN) FROM SPECTRA;");
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackRange, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << "\t";
  std::cout << std::endl;
};
void mzMLReader::getRange() {
  /* Create SQL statement */
  sql = (char*)("SELECT MIN(MZ),MAX(MZ) FROM PEAKS;");
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackRange, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << "\t";

  sql = (char*)("SELECT MIN(RETENTIONTIME),MAX(RETENTIONTIME) FROM SPECTRA;");
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackRange, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << "\t";

  /* Create SQL statement */
  sql = (char*)("SELECT MIN(INTENSITY),MAX(INTENSITY) FROM PEAKS;");
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackRange, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << std::endl;
};
void mzMLReader::getPeaksFromScan(int scan) {
  // std::string sqlstr = "SELECT PEAKS.MZ,PEAKS.INTENSITY FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID=SPECTRA.ID WHERE SPECTRA.SCAN='7029';";
  std::string sqlstr = "SELECT MZ,INTENSITY FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID=SPECTRA.ID WHERE " \
    "SCAN=" + num2str(scan) + ";";
  std::cout << sqlstr << endl;
   sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackPeakFromScan, (void*)data, &zErrMsg);
  std::cout << std::endl;
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
}
void mzMLReader::beginTransaction() {
  std::string sqlstr = "BEGIN;";
  sql = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    // std::cout << "Records created successfully" << std::endl;
  }
};
void mzMLReader::beginTransactionInMemory() {
  std::string sqlstr = "BEGIN;";
  sql = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc = sqlite3_exec(dbInMemory, sql, callback, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    // std::cout << "Records created successfully" << std::endl;
  }
};
void mzMLReader::endTransaction() {
  std::string sqlstr = "COMMIT;";
  sql = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    // std::cout << "Records created successfully" << std::endl;
  }

};
void mzMLReader::endTransactionInMemory() {
  std::string sqlstr = "COMMIT;";
  sql = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc = sqlite3_exec(dbInMemory, sql, callback, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    // std::cout << "Records created successfully" << std::endl;
  }

};
void mzMLReader::openInsertStmt() {
  std::string sqlstr = "INSERT INTO SPECTRA (ID,SCAN,RETENTIONTIME,SCANLEVEL,PREC_MZ,PREC_CHARGE,PREC_INTE,PEAKSINTESUM,NEXT,PREV) VALUES (? ,? ,?, ?, ?, ?, ?, ?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtSp, 0);

  sqlstr = "INSERT INTO ScanPairs (LevelOneScanID,LevelTwoScanID) VALUES (? ,?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtLevelPair, 0);

  sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME) VALUES (? ,? ,?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);

  sqlstr = "UPDATE SPECTRA SET NEXT = ? WHERE ID = ?; ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtUpdate, 0);

  sqlstr = "UPDATE SPECTRA SET PEAKSINTESUM = ? WHERE ID = ?; ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtSpSumUpdate, 0);
};
void mzMLReader::openInsertStmtMs1Only() {
  std::string sqlstr = "INSERT INTO PEAKS0 (ID,MZ,INTENSITY, RETENTIONTIME, COLOR) VALUES (?,?, ?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeakMs1Only, 0);
};
void mzMLReader::openInsertStmtInMemory() {
  std::string sqlstr = "INSERT INTO PEAKS0 (ID,MZ,INTENSITY, RETENTIONTIME, COLOR) VALUES (?,?, ?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(dbInMemory, sql, sqlstr.length(), &stmtPeakInMemory, 0);
};
void mzMLReader::closeInsertStmt() {
  sqlite3_finalize(stmtSp);
  sqlite3_finalize(stmtPeak);
  sqlite3_finalize(stmtLevelPair);
  sqlite3_finalize(stmtSpSumUpdate);
};
void mzMLReader::closeInsertStmtMs1Only() {
  sqlite3_finalize(stmtPeakMs1Only);
};
void mzMLReader::closeInsertStmtInMemory() {
  sqlite3_finalize(stmtPeakInMemory);
};
void mzMLReader::insertSpStmt(int scanIndex, std::string scan, double retentionTime, int scanLevel, double prec_mz, int prec_charge, double prec_inte, double peaksInteSum, int next, int prev) {
  sqlite3_reset(stmtSp);
  sqlite3_bind_int(stmtSp,1,scanIndex);
  sqlite3_bind_int(stmtSp,2,std::stoi(scan));
  sqlite3_bind_double(stmtSp,3,retentionTime);
  sqlite3_bind_int(stmtSp,4,scanLevel);
  sqlite3_bind_double(stmtSp,5,prec_mz);
  sqlite3_bind_int(stmtSp,6,prec_charge);
  sqlite3_bind_double(stmtSp,7,prec_inte);
  sqlite3_bind_double(stmtSp,8,peaksInteSum);
  sqlite3_bind_int(stmtSp,9,next);
  sqlite3_bind_int(stmtSp,10,prev);
  int r = sqlite3_step(stmtSp);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader::insertScanLevelPairStmt(int scanLevelOne, int scanLevelTwo) {
  sqlite3_reset(stmtLevelPair);
  sqlite3_bind_int(stmtLevelPair,1,scanLevelOne);
  sqlite3_bind_int(stmtLevelPair,2,scanLevelTwo);
  int r = sqlite3_step(stmtLevelPair);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader::updateSpStmt(int currentID, int prevID) {
  sqlite3_reset(stmtUpdate);
  sqlite3_bind_int(stmtUpdate,1,currentID);
  sqlite3_bind_int(stmtUpdate,2,prevID);
  int r = sqlite3_step(stmtUpdate);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader::updateSpSumStmt(int currentID, double peaksInteSum) {
  sqlite3_reset(stmtSpSumUpdate);
  sqlite3_bind_double(stmtSpSumUpdate,1,peaksInteSum);
  sqlite3_bind_int(stmtSpSumUpdate,2,currentID);
  int r = sqlite3_step(stmtSpSumUpdate);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
}
void mzMLReader::insertPeakStmt(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime) {
  // std::cout << peakIndex << "," << scanIndex << "," << intensity << "," << mz <<  std::endl;
  sqlite3_reset(stmtPeak);
  sqlite3_bind_int(stmtPeak,1,peakIndex);
  sqlite3_bind_int(stmtPeak,2,scanIndex);
  sqlite3_bind_double(stmtPeak,4,intensity);
  sqlite3_bind_double(stmtPeak,3,mz);
  sqlite3_bind_double(stmtPeak,5,retentionTime);
  int r = sqlite3_step(stmtPeak);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader::insertPeakStmtMs1(int peakIndex, double intensity, double mz, double retentionTime, std::string color) {
  // std::cout << peakIndex << "," << scanIndex << "," << intensity << "," << mz <<  std::endl;
  char *colorCode = (char *)color.c_str();
  sqlite3_reset(stmtPeakMs1Only);
  sqlite3_bind_int(stmtPeakMs1Only,1,peakIndex);
  sqlite3_bind_double(stmtPeakMs1Only,3,intensity);
  sqlite3_bind_double(stmtPeakMs1Only,2,mz);
  sqlite3_bind_double(stmtPeakMs1Only,4,retentionTime);
  sqlite3_bind_text(stmtPeakMs1Only,5,colorCode, color.size(), SQLITE_TRANSIENT);
  int r = sqlite3_step(stmtPeakMs1Only);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader::insertPeakStmtInMemory(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime, std::string color) {
  // std::cout << peakIndex << "," << scanIndex << "," << intensity << "," << mz <<  std::endl;
  char *colorCode = (char *)color.c_str();
  sqlite3_reset(stmtPeakInMemory);
  sqlite3_bind_int(stmtPeakInMemory,1,peakIndex);
  sqlite3_bind_double(stmtPeakInMemory,3,intensity);
  sqlite3_bind_double(stmtPeakInMemory,2,mz);
  sqlite3_bind_double(stmtPeakInMemory,4,retentionTime);
  sqlite3_bind_text(stmtPeakInMemory,5,colorCode, color.size(), SQLITE_TRANSIENT);
  int r = sqlite3_step(stmtPeakInMemory);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(dbInMemory) << std::endl;
  }
};
void mzMLReader::createIndex() {
  std::string sqlstr = "CREATE INDEX scan_index ON SPECTRA (SCAN);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Scan_index created successfully" << std::endl;
  }
  sqlstr = "CREATE INDEX scanPairs_index ON ScanPairs (LevelOneScanID,LevelTwoScanID);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "scanPairs_index created successfully" << std::endl;
  }
};
void mzMLReader::createIndexOnIdOnly(){
  std::string sqlstr = "CREATE INDEX scanID_index ON PEAKS0 (ID);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "ID_index created successfully" << std::endl;
  }
}
void mzMLReader::createIndexOnIdOnlyInMemory(){
  std::string sqlstr = "CREATE INDEX ID_index_mem ON PEAKS0 (ID);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(dbInMemory, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
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
void mzMLReader::setColor(int ms1PeakCount){
  std::string sqlstr = "SELECT * FROM PEAKS0 ORDER BY INTENSITY;";
  int topPerc = 1;//Two colors at each end of gradient are assigned to N% from bottom and top intensity
  int bottomPerc = 30;
  int top = ms1PeakCount * topPerc/100;
  int bottom = ms1PeakCount * bottomPerc/100;
  int remainColor = peakColor.size() - 2;//rest of colors to assign peaks
  int remainPeaks = ms1PeakCount - top - bottom;
  int eachPeak = remainPeaks / remainColor; //peak cnt in each interval

  std::vector<int> interval;

  for (int i = bottom; i < ms1PeakCount - top; i += eachPeak){
    interval.push_back(i);
    std::cout << "interval: " << i << std::endl;
  }
  std::cout << "total PEAKS " << ms1PeakCount << std::endl;

  openInsertStmtMs1Only();
  std::vector<int> *intervalPtr = &interval;
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(dbInMemory, sql, callbackUpdateData, intervalPtr, &zErrMsg);//after this function, gridBlocks has a peak for each grid
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    //std::cout << "Operation done successfully - insertPreakDataToGridBlocks" << std::endl;
  }
  closeInsertStmtMs1Only();
}
void mzMLReader::resetRange(){
  RANGE.MZMIN = 99999;
  RANGE.MZMAX = 0;
  RANGE.RTMIN = 99999;
  RANGE.RTMAX = 0;
  RANGE.INTMIN = 99999;
  RANGE.INTMAX = 0;
  RANGE.COUNT = 0;
}
void mzMLReader::insertPeakDataToGridBlocks(){
  std::string sqlstr = "SELECT * FROM PEAKS0;";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(dbInMemory, sql, callbackConvertData, dbInMemory, &zErrMsg);//after this function, gridBlocks has a peak for each grid
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    //std::cout << "Operation done successfully - insertPreakDataToGridBlocks" << std::endl;
  }
}
void mzMLReader::createSmallestTable(int &table_cnt, std::vector<int> &prev_peak_ID){
  /*input : peak ID of the current smallest table
    output : one more table created or not, based on how big the currnet smallest table is*/
  if (prev_peak_ID.size() > RANGE.MINPEAKS * 2){
    resetRange();
    //if current smallest table is too large
    int interval = int(prev_peak_ID.size() / RANGE.MINPEAKS);//which value to pick to make this new table to have peaks close to RANGE.MINPEAKS

    int cnt = 0;
    createLayerTable(int2str(table_cnt));
    beginTransaction();

    for (int i = 0; i < prev_peak_ID.size(); i = i + interval){
      insertPeaksToEachLayer(table_cnt, prev_peak_ID[i]);
      cnt++;
    }
    RANGE.COUNT = cnt;
    insertConfigOneTable();

    endTransaction();
    std::cout << "peak table " << table_cnt << " has peaks " << cnt << std::endl;
    table_cnt++;
  }
}
void mzMLReader::assignDataToGrid(int table_cnt,std::vector<int> &selected_peak_ID){
  /*input : number of table to be created (PEAKS1, PEAKS2...) and a vector containing peak ID to insert to the table
  output : vector is filled with peak IDs to insert*/
 
  int x = 0;
  int y = 0; 

  //index of 2d vector
  int xrange = pow(RANGE.MZSCALE, table_cnt - 1);
  int yrange = pow(RANGE.RTSCALE, table_cnt - 1);
  //int yrange = RANGE.RTSCALE;  

  std::cout << "grid " << GRID.GRIDBLOCKS.size() / xrange << " * " << GRID.GRIDBLOCKS[0].size() / yrange << std::endl;
  std::cout << "xrange : " << RANGE.MZSIZE * xrange << " yrange : " << yrange << std::endl; 

  while (y < GRID.GRIDBLOCKS[0].size()){
    while (x < GRID.GRIDBLOCKS.size()){
      double highestInte = 0;
      int highestPeakId = -1;

      for (int cur_x = x; cur_x < x + xrange && cur_x < GRID.GRIDBLOCKS.size(); cur_x++){
        for (int cur_y = y; cur_y < y + yrange && cur_y < GRID.GRIDBLOCKS[0].size(); cur_y++){
          //check intensity
          if (GRID.GRIDBLOCKS[cur_x][cur_y][1] > highestInte){
            highestInte =  GRID.GRIDBLOCKS[cur_x][cur_y][1];
            highestPeakId = GRID.GRIDBLOCKS[cur_x][cur_y][0];

            double mz = GRID.GRIDBLOCKS[cur_x][cur_y][2];
            double rt = GRID.GRIDBLOCKS[cur_x][cur_y][3];
            //to set information to add to CONFIG table
            
            if (mz > RANGE.MZMAX){
              RANGE.MZMAX = mz;
            }
            else if (mz < RANGE.MZMIN){
              RANGE.MZMIN = mz;
            };
            if (highestInte > RANGE.INTMAX){
              RANGE.INTMAX = highestInte;
            }
            else if (highestInte < RANGE.INTMIN){
              RANGE.INTMIN = highestInte;
            };
            if (rt > RANGE.RTMAX){
              RANGE.RTMAX = rt;
            }
            else if (rt < RANGE.RTMIN){
              RANGE.RTMIN = rt;
            };

          }
        }
      }
      if (highestPeakId >= 0){
        //insert and reset
        selected_peak_ID.push_back(highestPeakId);
      }
      x = x + xrange;
    }
    //moving to next row in grid
    y = y + yrange;
    x = 0;
  }
}
void mzMLReader::insertPeaksToEachLayer(int table_cnt, int scan_id){
  std::string sqlstr = "INSERT INTO PEAKS" + int2str(table_cnt) + "(ID,MZ,INTENSITY,RETENTIONTIME,COLOR)" + 
  "SELECT * FROM PEAKS" + int2str(table_cnt - 1) + " WHERE ID=" + int2str(scan_id)+ ";";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, callbackInsertPeak, db, &zErrMsg);     
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    //std::cout << "Operation done successfully - insertDataLayerTable" << std::endl;
  }
}
void mzMLReader::insertDataLayerTable(){
  /*output : PEAKSn tables are created and data are inserted to each table.*/
  double mz_range = RANGE.MZMAX - RANGE.MZMIN;//range of mz in mzmML
  int grid_width = floor(mz_range / RANGE.MZSIZE);

  double rt_range = RANGE.RTMAX - RANGE.RTMIN;//range of rt in mzmML
  int grid_height = floor(rt_range / RANGE.RTSIZE);

  std::cout << "mzrange: " << mz_range << " rt_range : " << rt_range << " grid_w : " << grid_width << "grid_h : " << grid_height << std::endl; 

  GRID.GRIDBLOCKS = std::vector<std::vector<std::vector<double> > > (grid_width, std::vector<std::vector<double> >(grid_height, std::vector<double>({-1, -1, -1, -1})));  
  std::cout << "grid size : " << GRID.GRIDBLOCKS.size() << " * " << GRID.GRIDBLOCKS[0].size() << std::endl;
  
  clock_t t1 = clock();
  insertPeakDataToGridBlocks();//peaks assigned to GRID.GRIDBLOCKS
  closeDatabaseInMemory();//close in-memory database. local disk db is still open.

  std::cout << "total peak in the GRIDBLOCKS is " << peak_in_grid << std::endl;
  std::cout <<"insertPeakDataToGridBlocks finished: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  int peak_cnt = peak_in_grid;//number of peaks in grid blocks (exclude empty grid blocks);
  int table_cnt = 1;

  std::vector<int> prev_peak_ID;//peakID in previous table

  std::cout << "peak_cnt : " << peak_cnt << " in PEAKS" << table_cnt << std::endl;

  while (peak_cnt >= RANGE.MINPEAKS){
    if (table_cnt == 1){
      resetRange();
      beginTransaction();

      RANGE.COUNT = peak_cnt;

      insertConfigOneTable();
      createLayerTable(int2str(table_cnt));
      
      for (int a = 0; a < GRID.GRIDBLOCKS.size(); a++){
        for (int b = 0; b < GRID.GRIDBLOCKS[a].size(); b++){
          int scan_id = GRID.GRIDBLOCKS[a][b][0];
          if (scan_id > 0){
            prev_peak_ID.push_back(scan_id);
            insertPeaksToEachLayer(table_cnt, scan_id);

            double inte = GRID.GRIDBLOCKS[a][b][1];
            double mz = GRID.GRIDBLOCKS[a][b][2];
            double rt = GRID.GRIDBLOCKS[a][b][3];
            //to set information to add to CONFIG table
            
            if (mz > RANGE.MZMAX){
              RANGE.MZMAX = mz;
            }
            else if (mz < RANGE.MZMIN){
              RANGE.MZMIN = mz;
            };
            if (inte > RANGE.INTMAX){
              RANGE.INTMAX = inte;
            }
            else if (inte < RANGE.INTMIN){
              RANGE.INTMIN = inte;
            };
            if (rt > RANGE.RTMAX){
              RANGE.RTMAX = rt;
            }
            else if (rt < RANGE.RTMIN){
              RANGE.RTMIN = rt;
            };
          }
        }
      }
      endTransaction();
      table_cnt++;
    }
    else if (table_cnt > 1){
      resetRange();

      std::vector<int> selected_peak_ID;//peaks to insert to the table

      assignDataToGrid(table_cnt, selected_peak_ID);

      peak_cnt = selected_peak_ID.size();

      std::cout << "peak_cnt : " << peak_cnt << " in PEAKS" << table_cnt << std::endl;
      
      if (peak_cnt >= RANGE.MINPEAKS){
        beginTransaction();
        RANGE.COUNT = peak_cnt;
        insertConfigOneTable();

        prev_peak_ID = selected_peak_ID;
        createLayerTable(int2str(table_cnt));
        
        for (int i = 0; i < selected_peak_ID.size(); i++){
          insertPeaksToEachLayer(table_cnt, selected_peak_ID[i]);
        }
        endTransaction();

        table_cnt++;
      }
      else{
        createSmallestTable(table_cnt, prev_peak_ID);//create one more table if current smallest table is still big
      }
    } 
    RANGE.LAYERCOUNT = table_cnt;
  }
}
void mzMLReader::setRange(Range tmpRange) {
  RANGE = tmpRange;
}
void mzMLReader::insertConfigOneTable() {
  /* Create SQL statement */
  std::string sqlstr = "INSERT INTO CONFIG (MZMIN,MZMAX,RTMIN,RTMAX,INTMIN,INTMAX,COUNT) VALUES (" +
    num2str(RANGE.MZMIN) + ", " + num2str(RANGE.MZMAX) + ", " + num2str(RANGE.RTMIN) + ", " + num2str(RANGE.RTMAX) + ", " +
    num2str(RANGE.INTMIN) + ", " + num2str(RANGE.INTMAX) + ", " + int2str(RANGE.COUNT)+ " ); ";
  sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
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
  sql = (char *)sqlstr.c_str();

  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Table created successfully\n");
    std::cout << "One table PEAKS" + num +" created successfully" << std::endl;
  }
};
void mzMLReader::createIndexLayerTable() {
  //for all layer tables, create index
  //need intensity index
  for (int i = 0; i < RANGE.LAYERCOUNT; i++){
    std::string sqlstr = "CREATE INDEX rtmz_index" + num2str(i) + " ON PEAKS" + num2str(i) + " (RETENTIONTIME, MZ);";
    sql = (char *)sqlstr.c_str();
    rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
    if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
    }else{
      // fprintf(stdout, "Records created successfully\n");
      //std::cout << "Retention time_index created successfully" << std::endl;
    }
  }
};

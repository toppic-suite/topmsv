#include "mzMLReader3D.hpp" 

#include <iostream>
#include <fstream>
#include <chrono>
#include <math.h> 
#include <algorithm>

Range RANGE;
sqlite3_stmt *stmtPeak;
sqlite3_stmt *stmtPeakInMemory;
sqlite3_stmt *stmtSp;
sqlite3_stmt *stmtLevelPair;
sqlite3_stmt *stmtUpdate;
sqlite3_stmt *stmtSpSumUpdate;
Grid GRID;
/*initialize 3d vector with default values*/
std::vector<std::vector<std::vector<double> > >  Grid::GRIDBLOCKS = std::vector<std::vector<std::vector<double> > > (GRID.LEVEL5[0], std::vector<std::vector<double> >(GRID.LEVEL5[1], std::vector<double>({-1, -1})));
  
//int filledGrid = 0;

std::string num2str(double num) {
  // std::cout << num << std::endl;
  stringstream stream;
  stream<<num;
  return stream.str();
};
std::string int2str(int num) {
  // std::cout << num << std::endl;
  stringstream stream;
  stream<<num;
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
int callbackConfig(void *NotUsed, int argc, char **argv, char **azColName) {
  RANGE.MZMIN = std::stod(argv[0]);
  RANGE.MZMAX = std::stod(argv[1]);
  RANGE.RTMIN = std::stod(argv[2]);
  RANGE.RTMAX = std::stod(argv[3]);
  RANGE.INTMIN = std::stod(argv[4]);
  RANGE.INTMAX = std::stod(argv[5]);
  RANGE.COUNT = std::stoi(argv[6]);
  RANGE.LAYERCOUNT = std::stoi(argv[7]);
  return 0;
};
int callbackPeakFromScan(void *NotUsed, int argc, char**argv, char **azColName) {
  std::cout << argv[0] << "," << argv[1] << std::endl ;
  return 0;
}
int callbackPeak(void *NotUsed, int argc, char **argv, char **azColName) {
  std::cout << argv[0] << "," << argv[1] << "," << std::stod(argv[2])/60 << "," << argv[3] << "\t" ;
  return 0;
};
int callbackInsertPeak(void *NotUsed, int argc, char **argv, char **azColName) {
  sqlite3_reset(stmtPeak);
  sqlite3_bind_int(stmtPeak,1,std::stoi(argv[0]));
  sqlite3_bind_int(stmtPeak,2,std::stoi(argv[1]));
  sqlite3_bind_double(stmtPeak,3,std::stod(argv[2]));
  sqlite3_bind_double(stmtPeak,4,std::stod(argv[3]));
  sqlite3_bind_double(stmtPeak,5,std::stod(argv[4]));

  std::cout << argv[0] << "," << argv[1] << "," << argv[2] << "," << argv[3] << "," << argv[4] << "\t" ;

  int r = sqlite3_step(stmtPeak);
  if (r != SQLITE_DONE) {
    // std::cout << sqlite3_errmsg(db) << std::endl;
    std::cout << argv[0] << "," << argv[1] << "," << argv[2] << "," << argv[3] << "," << argv[4] << "\t" ;
    std::cout << "callbackInsertPeak error" << std::endl;
  }
  return 0;
};
int callbackInsertPeakRTree(void *NotUsed, int argc, char **argv, char **azColName) {
  sqlite3_reset(stmtPeak);
  sqlite3_bind_int(stmtPeak,1,std::stoi(argv[0]));
  sqlite3_bind_int(stmtPeak,2,std::stoi(argv[1]));
  sqlite3_bind_double(stmtPeak,3,std::stod(argv[1]));
  sqlite3_bind_double(stmtPeak,4,std::stod(argv[2]));
  sqlite3_bind_double(stmtPeak,5,std::stod(argv[2]));
  int r = sqlite3_step(stmtPeak);
  if (r != SQLITE_DONE) {
    // std::cout << sqlite3_errmsg(db) << std::endl;
    std::cout << argv[0] << "," << argv[1] << "," << argv[2] << "," << argv[3] << "," << argv[4] << "\t" ;
    std::cout << "callbackInsertPeak error" << std::endl;
  }
  return 0;
};
int callbackConvertData(void *NotUsed, int argc, char **argv, char **azColName){
  /*ID  INT PRIMARY KEY     NOT NULL," \ 
    "SPECTRAID       INT      NOT NULL," \
    "MZ              REAL     NOT NULL," \
    "INTENSITY       REAL     NOT NULL," \
    "RETENTIONTIME   REAL     NOT NULL);");   <--------- PEAKS table */

  /*get the max min mz and max min rt, to get the range of mz and rt
  then multiply the data by target range/ current range*/   
  double mzRange = RANGE.MZMAX - RANGE.MZMIN;//range of mz in mzmML
  double rtRange = RANGE.RTMAX - RANGE.RTMIN;//range of rt in mzML

  //NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin

  int xIndex = floor(((std::stod(argv[2]) - RANGE.MZMIN) * (GRID.LEVEL5[0] - 1)) / mzRange);
  int yIndex = floor(((std::stod(argv[4]) - RANGE.RTMIN) * (GRID.LEVEL5[1] - 1)) / rtRange);

  if (xIndex < GRID.GRIDBLOCKS.size() && yIndex < GRID.GRIDBLOCKS[0].size()){
    /*see if the grid block at [xIndex][yIndex] already has a peak.
    if it has a peak, the value at the index is FALSE. If it does not have a peak yet, the value is TRUE.
    if TRUE, insert the peak into the corresponding table and set the value at [xIndex][yIndex] to be FALSE
  */
    if (GRID.GRIDBLOCKS[xIndex][yIndex][0] < 0){//if gridBlock does not have a peak yet
      //store the intensity and ID
      GRID.GRIDBLOCKS[xIndex][yIndex][0] = std::stoi(argv[0]);
      GRID.GRIDBLOCKS[xIndex][yIndex][1] = std::stod(argv[3]);

      //filledGrid++;
    }
    else{
      //compare intensity
      if (std::stod(argv[3]) > GRID.GRIDBLOCKS[xIndex][yIndex][1]){
        GRID.GRIDBLOCKS[xIndex][yIndex][0] = std::stoi(argv[0]);
        GRID.GRIDBLOCKS[xIndex][yIndex][1] = std::stod(argv[3]);
      }
    }
  }
  else{
    //if xIndex or yIndex are out of range, compare with the last index in GRIDBLOCKS
    if (xIndex >= GRID.GRIDBLOCKS.size()){
      xIndex = GRID.GRIDBLOCKS.size() -1;
    }
    if (yIndex >= GRID.GRIDBLOCKS[0].size()){
      yIndex = GRID.GRIDBLOCKS[0].size() -1;
    }
    //std::cout << "xIndex, yIndex: " << xIndex << " " << yIndex << std::endl;

    if (GRID.GRIDBLOCKS[xIndex][yIndex][0] < 0){//if gridBlock does not have a peak yet
      //store the intensity and ID
      GRID.GRIDBLOCKS[xIndex][yIndex][0] = std::stoi(argv[0]);
      GRID.GRIDBLOCKS[xIndex][yIndex][1] = std::stod(argv[3]);

      //filledGrid++;
    }
    else{
      //compare intensity
      if (std::stod(argv[3]) > GRID.GRIDBLOCKS[xIndex][yIndex][1]){
        GRID.GRIDBLOCKS[xIndex][yIndex][0] = std::stoi(argv[0]);
        GRID.GRIDBLOCKS[xIndex][yIndex][1] = std::stod(argv[3]);
      }
    }
  }
  
  //GRIDBLOCKS now should be having one peak for each grid, unless there was no peak in that grid mz and rt range
  return 0;
}
mzMLReader3D::mzMLReader3D() {
  data = (char*)("Callback function called");
};

void mzMLReader3D::setNameInMemory(std::string fileName) {
   fileName.insert(fileName.length() - 5, "_3D"); 
   databaseNameInMemory = fileName.replace(fileName.length() - 4,4,"memory");
  // std::cout << "databaseName" << databaseName << std::endl;
};
void mzMLReader3D::setName(std::string fileName) {
   fileName.insert(fileName.length() - 5, "_3D"); 
   databaseName = fileName.replace(fileName.length() - 4,4,"db");
  // std::cout << "databaseName" << databaseName << std::endl;
};
void mzMLReader3D::openDatabaseInMemory(std::string fileName) {
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
void mzMLReader3D::openDatabase(std::string fileName) {
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
void mzMLReader3D::closeDatabase() {
   sqlite3_close(db);
};
void mzMLReader3D::closeDatabaseInMemory() {
   sqlite3_close(dbInMemory);
};

void mzMLReader3D::creatTable() {
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
      // std::cout << "Table PEAKS created successfully" << std::endl;
   }
};
void mzMLReader3D::creatTableInMemory() {
   /* Create SQL statement */
   sql = (char*)("CREATE TABLE PEAKS("  \
         "ID INT PRIMARY KEY     NOT NULL," \
         "SPECTRAID     INT      NOT NULL REFERENCES SPEACTRA(ID)," \
         "MZ            REAL     NOT NULL," \
         "INTENSITY     REAL     NOT NULL," \
         "RETENTIONTIME     REAL     NOT NULL);");

   /* Execute SQL statement */
   rc = sqlite3_exec(dbInMemory, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
      // std::cout << "Table PEAKS created successfully" << std::endl;
   }
};
void mzMLReader3D::insertSp(int scanIndex, std::string scan, double retentionTime) {
   /* Create SQL statement */
   std::string sqlstr = "INSERT INTO SPECTRA (ID,SCAN,RETENTIONTIME) VALUES (" + int2str(scanIndex) + ", " 
      + scan + ", " + num2str(retentionTime) + " ); ";
   sql = (char *)sqlstr.c_str();

   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      // std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Records created successfully\n");
      // std::cout << "Records created successfully" << std::endl;
   }
};
void mzMLReader3D::insertPeakFor3DViz(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime) {
   /* Create SQL statement */

   std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME) "  \
         "VALUES (" + int2str(peakIndex) + ", " + int2str(scanIndex) + ", " + num2str(mz) + 
         ", " + num2str(intensity) + ", " + num2str(retentionTime) + " ); ";

   sql = (char *)sqlstr.c_str();

   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
      if (rc == 19) {
        sqlstr = "SELECT * FROM PEAKS WHERE ID=" + int2str(peakIndex) + ";";
        std::cout << sqlstr << std::endl;
        std::cout << int2str(peakIndex) << ", " << int2str(scanIndex) << ", " << num2str(mz) << ", " << num2str(intensity) << ", " << num2str(retentionTime)<< std::endl;
        sql = (char *)sqlstr.c_str();
        /* Execute SQL statement */
        rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
        if( rc != SQLITE_OK ){
          std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
          sqlite3_free(zErrMsg);
        }
      }
   }else{
      // fprintf(stdout, "Records created successfully\n");
      // std::cout << "Records created successfully" << std::endl;
   }
};
void mzMLReader3D::getScanRange() {
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
void mzMLReader3D::getRange() {
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
void mzMLReader3D::getPeaksFromScan(int scan) {
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
void mzMLReader3D::getPeaks(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
  /* Create SQL statement */
  // std::string sqlstr = "SELECT PEAKS.ID,MZ,RETENTIONTIME,INTENSITY FROM PEAKS,SPECTRA WHERE PEAKS.SPECTRAID=SPECTRA.ID AND " \
  //   "MZ>" + num2str(mzmin) + " AND MZ<" + num2str(mzmax) + " AND RETENTIONTIME>" + num2str(rtmin) + " AND RETENTIONTIME<" +
  //   num2str(rtmax) + " AND INTENSITY>" + num2str(intmin) + " ORDER BY INTENSITY DESC LIMIT 0," + int2str(numpoints) + ";";
  //  sql = (char *)sqlstr.c_str();
  std::string sqlstr = "SELECT PEAKS.ID,MZ,RETENTIONTIME,INTENSITY FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID=SPECTRA.ID WHERE " \
    "MZ>" + num2str(mzmin) + " AND MZ<" + num2str(mzmax) + " AND RETENTIONTIME>" + num2str(rtmin) + " AND RETENTIONTIME<" +
    num2str(rtmax) + " AND INTENSITY>" + num2str(intmin) + " ORDER BY INTENSITY DESC LIMIT 0," + int2str(numpoints) + ";";
   sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackPeak, (void*)data, &zErrMsg);
  std::cout << std::endl;
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
    // std::cout << i+1 << "," << pointsList[i].mz << "," << pointsList[i].rt << "," << pointsList[i].inten << "\t";
};
void mzMLReader3D::beginTransaction() {
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
void mzMLReader3D::beginTransactionInMemory() {
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
void mzMLReader3D::endTransaction() {
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
void mzMLReader3D::endTransactionInMemory() {
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
void mzMLReader3D::synchronous() {
  std::string sqlstr = "PRAGMA synchronous = OFF;";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, 0);
};

void mzMLReader3D::openInsertStmt() {
  std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY, RETENTIONTIME) VALUES (? ,? ,?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);
};
void mzMLReader3D::openInsertStmtInMemory() {
  std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY, RETENTIONTIME) VALUES (? ,? ,?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(dbInMemory, sql, sqlstr.length(), &stmtPeakInMemory, 0);
};
void mzMLReader3D::closeInsertStmt() {
  sqlite3_finalize(stmtPeak);
};
void mzMLReader3D::closeInsertStmtInMemory() {
  sqlite3_finalize(stmtPeakInMemory);
};
void mzMLReader3D::insertSpStmt(int scanIndex, std::string scan, double retentionTime, int scanLevel, double prec_mz, int prec_charge, double prec_inte, double peaksInteSum, int next, int prev) {
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
void mzMLReader3D::insertScanLevelPairStmt(int scanLevelOne, int scanLevelTwo) {
  sqlite3_reset(stmtLevelPair);
  sqlite3_bind_int(stmtLevelPair,1,scanLevelOne);
  sqlite3_bind_int(stmtLevelPair,2,scanLevelTwo);
  int r = sqlite3_step(stmtLevelPair);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader3D::updateSpStmt(int currentID, int prevID) {
  sqlite3_reset(stmtUpdate);
  sqlite3_bind_int(stmtUpdate,1,currentID);
  sqlite3_bind_int(stmtUpdate,2,prevID);
  int r = sqlite3_step(stmtUpdate);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader3D::updateSpSumStmt(int currentID, double peaksInteSum) {
  sqlite3_reset(stmtSpSumUpdate);
  sqlite3_bind_double(stmtSpSumUpdate,1,peaksInteSum);
  sqlite3_bind_int(stmtSpSumUpdate,2,currentID);
  int r = sqlite3_step(stmtSpSumUpdate);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
}
void mzMLReader3D::insertPeakStmt(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime) {
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
void mzMLReader3D::insertPeakStmtInMemory(int peakIndex, int scanIndex, double intensity, double mz, double retentionTime) {
  // std::cout << peakIndex << "," << scanIndex << "," << intensity << "," << mz <<  std::endl;
  sqlite3_reset(stmtPeakInMemory);
  sqlite3_bind_int(stmtPeakInMemory,1,peakIndex);
  sqlite3_bind_int(stmtPeakInMemory,2,scanIndex);
  sqlite3_bind_double(stmtPeakInMemory,4,intensity);
  sqlite3_bind_double(stmtPeakInMemory,3,mz);
  sqlite3_bind_double(stmtPeakInMemory,5,retentionTime);
  int r = sqlite3_step(stmtPeakInMemory);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(dbInMemory) << std::endl;
  }
};
void mzMLReader3D::createIndexOnIdOnly(){
  std::string sqlstr = "CREATE INDEX id_index ON PEAKS (ID);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "id_index created successfully" << std::endl;
  }
}
void mzMLReader3D::createIndex() {
  std::string sqlstr = "CREATE INDEX intensity_index ON PEAKS (SPECTRAID);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Intensity_index created successfully" << std::endl;
  }
  sqlstr = "CREATE INDEX rt_index ON PEAKS (RETENTIONTIME);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Retention time_index created successfully" << std::endl;
  }
  sqlstr = "CREATE INDEX mz_index ON PEAKS (MZ);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Mz_index created successfully" << std::endl;
  }
};

/*
Use only one table.
Use only one table.
Use only one table.
Use only one table.
Use only one table.
*/
void mzMLReader3D::insertPeakDataToGridBlocks(int peakCount){
  std::string sqlstr = "SELECT * FROM PEAKS;";
    sql = (char *)sqlstr.c_str();
    rc = sqlite3_exec(dbInMemory, sql, callbackConvertData, dbInMemory, &zErrMsg);//after this function, gridBlocks has a peak for each grid
    if( rc != SQLITE_OK ){
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
    }else{
      //std::cout << "Operation done successfully - insertPreakDataToGridBlocks" << std::endl;
    }
}

void mzMLReader3D::insertDataLayerTable(Range range, std::string file_name){
  //set mz, rt range to be used in insertPeakDataToGridBlocks()
  RANGE.MZMIN = range.MZMIN;
  RANGE.MZMAX = range.MZMAX;
  RANGE.RTMIN = range.RTMIN;
  RANGE.RTMAX = range.RTMAX;

  std::vector<std::vector<int>> gridRange = {GRID.LEVEL0, GRID.LEVEL1, GRID.LEVEL2, GRID.LEVEL3, GRID.LEVEL4, GRID.LEVEL5};

  std::chrono::steady_clock::time_point begin = std::chrono::steady_clock::now();

  insertPeakDataToGridBlocks(range.COUNT);//peaks assigned to GRID.GRIDBLOCKS

  closeDatabaseInMemory();//close in-memory database. local disk db is still open.

  std::chrono::steady_clock::time_point endGrid = std::chrono::steady_clock::now();
  std::cout << "grid assignment finished " << std::endl;
  std::cout << "Time = " << std::chrono::duration_cast<std::chrono::milliseconds>(endGrid - begin).count() << "ms" << std::endl;

  for (int k = 0; k <= range.LAYERCOUNT; k++){//from 0-5 (each layer table)
  //for (int k = 2; k <= 2; k++){//from 0-5 (each layer table)
    int x = 0;
    int y = 0; 
    int insert = 0;//counter for inserted peaks

    int xRange = ceil(GRID.LEVEL5[0]/(float)gridRange[k][0]);//without float cast, 250/100 = 2
    int yRange = ceil(GRID.LEVEL5[1]/(float)gridRange[k][1]);

    std::vector<int> selectedPeakID;//highest peaks
    //std::vector<std::vector<int>> secondHighestPeaks;//secnd highest peaks, for use when peaks are less than table size 

    while (y < GRID.LEVEL5[1]){
      //int pickedPeaks = 0;
      while (x < GRID.LEVEL5[0]){
        int highestInte = 0;
        int highestPeakId = -1;
        //int secondHighestInte = 0;
        //int secondHighestPeakId = -1;

        for (int curX = x; curX < x + xRange && curX < GRID.LEVEL5[0]; curX++){
          for (int curY = y; curY < y + yRange && curY < GRID.LEVEL5[1]; curY++){
            //check intensity
            if (GRID.GRIDBLOCKS[curX][curY][1] > highestInte){
              //secondHighestInte = highestInte;
              //secondHighestPeakId = highestPeakId;

              highestInte =  GRID.GRIDBLOCKS[curX][curY][1];
              highestPeakId = GRID.GRIDBLOCKS[curX][curY][0];
            }
          }
        }
        if (highestPeakId >= 0){
          //insert and reset
          selectedPeakID.push_back(highestPeakId);
          //secondHighestPeaks.push_back({secondHighestInte, secondHighestPeakId});
          //pickedPeaks++;
        }
        x = x + xRange;
      }
      //moving to next row in grid
      y = y + yRange;
      x = 0;
    }
    //std::cout << "selectedPeaks : " << selectedPeakID.size() << std::endl;
    /*
    if (selectedPeakID.size() < (gridRange[k][0] * gridRange[k][1])){//if space left for more peaks
        std::sort(secondHighestPeaks.begin(), secondHighestPeaks.end());
        int peakDiff = gridRange[k][0] * gridRange[k][1] - selectedPeakID.size();
        //std::cout << "peakDiff : " << peakDiff << std::endl; 
        for (int p = 0; p < peakDiff && p < secondHighestPeaks.size(); p++){
          //std::cout << "p : " << p << std::endl;
          selectedPeakID.push_back(secondHighestPeaks[p][1]);
        }
    }
     std::cout << "selectedPeaks with extra peaks : " << selectedPeakID.size() << std::endl;*/
    //int fail =0;
     beginTransaction();
     for (int a = 0; a < selectedPeakID.size(); a++){
       std::string sqlstr = "INSERT INTO PEAKS" + int2str(k) + "(ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME)" + 
          "SELECT * FROM PEAKS WHERE ID=" + int2str(selectedPeakID[a])+ ";";
          sql = (char *)sqlstr.c_str();
          rc = sqlite3_exec(db, sql, callbackInsertPeak, db, &zErrMsg);
          
          if( rc != SQLITE_OK ){
            std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
            sqlite3_free(zErrMsg);
            //fail++;
          }else{
            insert++;
            //std::cout << "Operation done successfully - insertDataLayerTable" << std::endl;
          }
     }
     endTransaction();
    std::cout << "total inserted peaks : " << insert << std::endl;
    //std::cout << "not inserted peaks : " << fail << std::endl;
  }
  std::chrono::steady_clock::time_point end = std::chrono::steady_clock::now();
  std::cout << "insert finished " << std::endl;
  std::cout << "Time = " << std::chrono::duration_cast<std::chrono::milliseconds>(end - endGrid).count() << "ms" << std::endl;
}
void mzMLReader3D::setRange(Range tmpRange) {
  RANGE = tmpRange;
  double maxBlock = RANGE.COUNT/RANGE.MAXRETURN;
  int layerCount = ceil(log(maxBlock)/log(4)) + 1;
  layerCount = layerCount > 0 ? layerCount : 1;
  RANGE.LAYERCOUNT = layerCount;
  for (int i = 0; i < layerCount; i++) {
    RANGE.MZSIZE.push_back((RANGE.MZMAX - RANGE.MZMIN)/pow(2,i));
    RANGE.RTSIZE.push_back((RANGE.RTMAX - RANGE.RTMIN)/pow(2,i));
  }
  // MZMIN = mzmin;
  // MZMAX = mzmax;
  // RTMIN = rtmin;
  // RTMAX = rtmax;
  // MZ_GROUP1_SIZE = (MZMAX - MZMIN)/2;
  // MZ_GROUP2_SIZE = (MZMAX - MZMIN)/4;
  // MZ_GROUP3_SIZE = (MZMAX - MZMIN)/8;
  // MZ_GROUP4_SIZE = (MZMAX - MZMIN)/16;
  // MZ_GROUP5_SIZE = (MZMAX - MZMIN)/32;
  // RT_GROUP1_SIZE = (RTMAX - RTMIN)/2;
  // RT_GROUP2_SIZE = (RTMAX - RTMIN)/4;
  // RT_GROUP3_SIZE = (RTMAX - RTMIN)/8;
  // RT_GROUP4_SIZE = (RTMAX - RTMIN)/16;
  // RT_GROUP5_SIZE = (RTMAX - RTMIN)/32;
  // std::cout << "Set range: " << RANGE.MZMIN << " " << RANGE.MZMAX << " " << RANGE.RTMIN << " " << RANGE.RTMAX << std::endl;
  return;
};
void mzMLReader3D::setGroup(double mz, double rt) {
  // std::string group_str = "";
  // double mz_range = mz - MZMIN;
  // double rt_range = rt - RTMIN;

  // MZ_GROUP1 = (int)(mz_range / MZ_GROUP1_SIZE);
  // MZ_GROUP2 = (int)(mz_range / MZ_GROUP2_SIZE);
  // MZ_GROUP3 = (int)(mz_range / MZ_GROUP3_SIZE);
  // MZ_GROUP4 = (int)(mz_range / MZ_GROUP4_SIZE);
  // MZ_GROUP5 = (int)(mz_range / MZ_GROUP5_SIZE);
  // RT_GROUP1 = (int)(rt_range / RT_GROUP1_SIZE);
  // RT_GROUP2 = (int)(rt_range / RT_GROUP2_SIZE);
  // RT_GROUP3 = (int)(rt_range / RT_GROUP3_SIZE);
  // RT_GROUP4 = (int)(rt_range / RT_GROUP4_SIZE);
  // RT_GROUP5 = (int)(rt_range / RT_GROUP5_SIZE);
  // std::cout << "mz:" << mz << ",mz_range:" << mz_range << " " << MZ_GROUP1 << " " << MZ_GROUP2 << " " << MZ_GROUP3 <<  " " << MZ_GROUP4 << " " << MZ_GROUP5 << std::endl;
  return;
};
std::string mzMLReader3D::getGroup(double mzmin, double mzmax, double rtmin, double rtmax) {
  std::string group_str = "";
  double mz_range = mzmax - mzmin;
  double rt_range = rtmax - rtmin;

  return group_str;
};

void mzMLReader3D::creatTableOneTable() {
   /* Create SQL statement */
   sql = (char*)("CREATE TABLE PEAKS("  \
         "ID  INT PRIMARY KEY     NOT NULL," \
         "SPECTRAID       INT      NOT NULL," \
         "MZ              REAL     NOT NULL," \
         "INTENSITY       REAL     NOT NULL," \
         "RETENTIONTIME   REAL     NOT NULL);");

   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
      std::cout << "One table PEAKS created successfully" << std::endl;
   }
   /* Create SQL statement */
   sql = (char*)("CREATE TABLE CONFIG("  \
         "ID  INT PRIMARY KEY     NOT NULL," \
         "MZMIN           REAL     NOT NULL," \
         "MZMAX           REAL     NOT NULL," \
         "RTMIN           REAL     NOT NULL," \
         "RTMAX           REAL     NOT NULL," \
         "INTMIN          REAL     NOT NULL," \
         "INTMAX          REAL     NOT NULL," \
         "COUNT           INT     NOT NULL," \
         "LAYERCOUNT      INT     NOT NULL);");

   /* Execute SQL statement */
   rc = sqlite3_exec(db, sql, callback, 0, &zErrMsg);
   if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
   }else{
      // fprintf(stdout, "Table created successfully\n");
      std::cout << "One table CONFIG created successfully" << std::endl;
   }
};
void mzMLReader3D::getRangeOneTable() {
  /* Create SQL statement */
  sql = (char*)("SELECT MZMIN,MZMAX,RTMIN,RTMAX,INTMIN,INTMAX FROM CONFIG;");
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
void mzMLReader3D::getPeaksOneTable(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
  getConfig();
  int layer = RANGE.LAYERCOUNT-1;
  for (int i = layer; i > -1; i--) {
    layer = i;
    if (RANGE.MZSIZE[i] > mzmax - mzmin) {
      // std::cout << "RANGE.MZSIZE[i]: " << RANGE.MZSIZE[i] << ">" << "mzmax - mzmin :" << (mzmax - mzmin) << std::endl;
      layer = i + 1;
      break;
    }
  }
  std::string layerstr = num2str(layer);
  if (layer == RANGE.LAYERCOUNT) {
    layerstr = "";
  }
  /* Create SQL statement */
  std::string sqlstr = "SELECT ID,MZ,RETENTIONTIME,INTENSITY FROM PEAKS" + layerstr + " WHERE " \
    "MZ>" + num2str(mzmin) + " AND MZ<" + num2str(mzmax) + " AND RETENTIONTIME>" + num2str(rtmin) + " AND RETENTIONTIME<" +
    num2str(rtmax) + " AND INTENSITY>" + num2str(intmin);
  // if(mzmin == 1200 && mzmax == 1800){
  //   sqlstr =sqlstr + " AND MZ_GROUP1 = 1";
  // } else if(mzmin == 1200 && mzmax == 1600){
  //   sqlstr =sqlstr + " AND MZ_GROUP2 = 2";
  // } else if(mzmin == 1300 && mzmax == 1500){
  //   sqlstr =sqlstr + " AND MZ_GROUP2 = 2";
  // } else if(mzmin == 1450 && mzmax == 1500){
  //   sqlstr =sqlstr + " AND MZ_GROUP3 = 5";
  // } else if(mzmin == 1490 && mzmax == 1500){
  //   sqlstr =sqlstr + " AND MZ_GROUP3 = 5";
  // };
  sqlstr = sqlstr + " ORDER BY INTENSITY DESC LIMIT 0," + int2str(numpoints) + ";";
  sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackPeak, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << std::endl;
    // std::cout << i+1 << "," << pointsList[i].mz << "," << pointsList[i].rt << "," << pointsList[i].inten << "\t";
  // std::cout << "RANGE.MZSIZE[i]: " << RANGE.MZSIZE[layer-1] << ">=" << "mzmax - mzmin :" << (mzmax - mzmin) << std::endl;
  // std::cout << sqlstr << std::endl;
};
void mzMLReader3D::openInsertStmtOneTable() {
  // std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME," \
  // "MZ_GROUP1,MZ_GROUP2,MZ_GROUP3,MZ_GROUP4,MZ_GROUP5,RT_GROUP1,RT_GROUP2,RT_GROUP3,RT_GROUP4,RT_GROUP5)" \
  // " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); ";
  std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME)" \
    " VALUES (?, ?, ?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);
};
void mzMLReader3D::closeInsertStmtOneTable() {
  sqlite3_finalize(stmtPeak);
};
void mzMLReader3D::insertPeakStmtOneTable(int peakIndex, int scanIndex, double mz, double intensity, double retentionTime) {
  // std::cout << peakIndex << "," << scanIndex << "," << intensity << "," << mz <<  std::endl;
  // setGroup(mz, retentionTime);
  sqlite3_reset(stmtPeak);
  sqlite3_bind_int(stmtPeak,1,peakIndex);
  sqlite3_bind_int(stmtPeak,2,scanIndex);
  sqlite3_bind_double(stmtPeak,3,mz);
  sqlite3_bind_double(stmtPeak,4,intensity);
  sqlite3_bind_double(stmtPeak,5,retentionTime);
  // sqlite3_bind_int(stmtPeak,6,MZ_GROUP1);
  // sqlite3_bind_int(stmtPeak,7,MZ_GROUP2);
  // sqlite3_bind_int(stmtPeak,8,MZ_GROUP3);
  // sqlite3_bind_int(stmtPeak,9,MZ_GROUP4);
  // sqlite3_bind_int(stmtPeak,10,MZ_GROUP5);
  // sqlite3_bind_int(stmtPeak,11,RT_GROUP1);
  // sqlite3_bind_int(stmtPeak,12,RT_GROUP2);
  // sqlite3_bind_int(stmtPeak,13,RT_GROUP3);
  // sqlite3_bind_int(stmtPeak,14,RT_GROUP4);
  // sqlite3_bind_int(stmtPeak,15,RT_GROUP5);
  int r = sqlite3_step(stmtPeak);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};
void mzMLReader3D::insertConfigOneTable() {
  /* Create SQL statement */
  std::string sqlstr = "INSERT INTO CONFIG (ID,MZMIN,MZMAX,RTMIN,RTMAX,INTMIN,INTMAX,COUNT,LAYERCOUNT) VALUES (1," +
    num2str(RANGE.MZMIN) + ", " + num2str(RANGE.MZMAX) + ", " + num2str(RANGE.RTMIN) + ", " + num2str(RANGE.RTMAX) + ", " +
    num2str(RANGE.INTMIN) + ", " + num2str(RANGE.INTMAX) + ", " + num2str(RANGE.COUNT) + ", " + num2str(RANGE.LAYERCOUNT) + " ); ";
  sql = (char *)sqlstr.c_str();
  std::cout << sql << std::endl;
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    sqlite3_free(zErrMsg);
  }

};
void mzMLReader3D::creatLayersTable() {
  std::string origin = "";
  clock_t t1 = clock();
  for (int i = RANGE.LAYERCOUNT; i > -1; i--) {
    t1 = clock();
    beginTransaction();
    createLayerTable(num2str(i));
    endTransaction();
    std::cout <<"InsertLayer Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
    t1 = clock();
    std::cout << "Layer " << i << " table created." << std::endl;
  }
};
void mzMLReader3D::getConfig() {
  /* Create SQL statement */
  sql = (char*)("SELECT MZMIN,MZMAX,RTMIN,RTMAX,INTMIN,INTMAX,COUNT,LAYERCOUNT FROM CONFIG;");
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackConfig, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }
  setRange(RANGE);
};

void mzMLReader3D::createLayerTable(std::string num) {
  /* Create SQL statement */
  std::string sqlstr = "CREATE TABLE PEAKS" + num + "("  \
       "ID  INT PRIMARY KEY     NOT NULL," \
       "SPECTRAID       INT      NOT NULL," \
       "MZ              REAL     NOT NULL," \
       "INTENSITY       REAL     NOT NULL," \
       "RETENTIONTIME   REAL     NOT NULL);";
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
void mzMLReader3D::openInsertLayerStmt(std::string num) {
  std::string sqlstr = "INSERT INTO PEAKS" + num +" (ID,SPECTRAID,MZ,RETENTIONTIME,INTENSITY) VALUES (? ,? ,?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);
};
void mzMLReader3D::closeInsertLayerStmt() {
  sqlite3_finalize(stmtPeak);
};
void mzMLReader3D::insertPeaksLayerStmt(std::string origin, int j, int k, double mzsize, double rtsize) {
  double mzmin = RANGE.MZMIN + mzsize * j;
  double mzmax = mzmin + mzsize;
  double rtmin = RANGE.RTMIN + rtsize * k;
  double rtmax = rtmin + rtsize;
  /* Create SQL statement */
  std::string sqlstr = "SELECT ID,SPECTRAID,MZ,RETENTIONTIME,INTENSITY FROM PEAKS" + origin + " WHERE " \
    "MZ>" + num2str(mzmin) + " AND MZ<" + num2str(mzmax) + " AND RETENTIONTIME>" + num2str(rtmin) + " AND RETENTIONTIME<" +
    num2str(rtmax) + " ORDER BY INTENSITY DESC LIMIT 0," + int2str(RANGE.MAXRETURN) + ";";
  sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackInsertPeak, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
    // std::cout << i+1 << "," << pointsList[i].mz << "," << pointsList[i].rt << "," << pointsList[i].inten << "\t";
  // std::cout << sqlstr << std::endl;
  
};
void mzMLReader3D::createIndexLayerTable(int layerCount) {
  //for all layer tables, create index
  for (int i = 0; i <= layerCount; i++){
    std::string sqlstr = "CREATE INDEX intensity_index" + num2str(i) + " ON PEAKS" + num2str(i) + " (SPECTRAID);";
    sql = (char *)sqlstr.c_str();
    rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
    if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
    }else{
      // fprintf(stdout, "Records created successfully\n");
      std::cout << "Intensity_index created successfully" << std::endl;
    }
    sqlstr = "CREATE INDEX rt_index" + num2str(i) + " ON PEAKS" + num2str(i) + " (RETENTIONTIME);";
    sql = (char *)sqlstr.c_str();
    rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
    if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
    }else{
      // fprintf(stdout, "Records created successfully\n");
      std::cout << "Retention time_index created successfully" << std::endl;
    }
    sqlstr = "CREATE INDEX mz_index" + num2str(i) + " ON PEAKS" + num2str(i) + " (MZ);";
    sql = (char *)sqlstr.c_str();
    rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
    if( rc != SQLITE_OK ){
      // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
      std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
      sqlite3_free(zErrMsg);
    }else{
      // fprintf(stdout, "Records created successfully\n");
      std::cout << "Mz_index created successfully" << std::endl;
    }
  }
};
void mzMLReader3D::createIndexOneTable() {
  std::string sqlstr = "CREATE INDEX intensity_index ON PEAKS (INTENSITY);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Intensity_index created successfully" << std::endl;
  }
  sqlstr = "CREATE INDEX peaks_index ON PEAKS (MZ,RETENTIONTIME,INTENSITY);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Peaks_index created successfully" << std::endl;
  }
};


void mzMLReader3D::creatLayersTableRTree() {
  std::string origin = "";
  clock_t t1 = clock();
  getConfig();
  std::cout <<"Get Config Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  beginTransaction();
  createLayerTableRTree(num2str(RANGE.LAYERCOUNT));
  openInsertLayerStmtRTree(num2str(RANGE.LAYERCOUNT));
  insertAllPeaksLayerStmtRTree();
  closeInsertLayerStmtRTree();
  endTransaction();
  std::cout <<"InsertLayer Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  for (int i = RANGE.LAYERCOUNT - 1; i > -1; i--) {
    origin = num2str(i+1);
    double mzsize = RANGE.MZSIZE[i];
    double rtsize = RANGE.RTSIZE[i];
    int n = pow(2,i);
    t1 = clock();
    beginTransaction();
    createLayerTableRTree(num2str(i));
    openInsertLayerStmtRTree(num2str(i));
    for (int j = 0; j < n; j++) {
      for (int k = 0; k < n; k++) {
        // std::cout << "Inserting region <" << j << "," << k << "> for layer " << i << " <" << n << "," << n << ">" << std::endl;
        insertPeaksLayerStmtRTree(origin, j, k, mzsize, rtsize);
      }
    }
    closeInsertLayerStmtRTree();
    endTransaction();
    std::cout <<"InsertLayer Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
    t1 = clock();
    // std::cout << "Layer " << i << " table created." << std::endl;
  }
};
void mzMLReader3D::createLayerTableRTree(std::string num) {
  /* Create SQL statement */
  std::string sqlstr = "CREATE VIRTUAL TABLE PEAKS" + num + " USING rtree("  \
       "ID," \
       "minMZ, maxMZ," \
       "minRT, maxRT)";
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
void mzMLReader3D::openInsertLayerStmtRTree(std::string num) {
  std::string sqlstr = "INSERT INTO PEAKS" + num +" VALUES (? ,? ,?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);
};
void mzMLReader3D::closeInsertLayerStmtRTree() {
  sqlite3_finalize(stmtPeak);
};
void mzMLReader3D::insertAllPeaksLayerStmtRTree() {
  /* Create SQL statement */
  std::string sqlstr = "SELECT ID,MZ,RETENTIONTIME FROM PEAKS;";
  sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackInsertPeakRTree, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
};
void mzMLReader3D::insertPeaksLayerStmtRTree(std::string origin, int j, int k, double mzsize, double rtsize) {
  double mzmin = RANGE.MZMIN + mzsize * j;
  double mzmax = mzmin + mzsize;
  double rtmin = RANGE.RTMIN + rtsize * k;
  double rtmax = rtmin + rtsize;
  /* Create SQL statement */
  // std::string sqlstr = "SELECT ID,MZ,RETENTIONTIME FROM PEAKS WHERE " \
  //   "MZ>" + num2str(mzmin) + " AND MZ<" + num2str(mzmax) + " AND RETENTIONTIME>" + num2str(rtmin) + " AND RETENTIONTIME<" +
  //   num2str(rtmax) + " ORDER BY INTENSITY DESC LIMIT 0," + int2str(RANGE.MAXRETURN) + ";";

  std::string sqlstr = "SELECT PEAKS.ID,MZ,RETENTIONTIME FROM PEAKS,PEAKS" + origin + " WHERE " \
    "PEAKS.ID=PEAKS" + origin + ".ID AND " \
    "minMZ>" + num2str(mzmin) + " AND maxMZ<" + num2str(mzmax) + " AND minRT>" + num2str(rtmin) + " AND maxRT<" +
    num2str(rtmax) + " ORDER BY INTENSITY DESC LIMIT 0," + int2str(RANGE.MAXRETURN) + ";";
  sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackInsertPeakRTree, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
    // std::cout << i+1 << "," << pointsList[i].mz << "," << pointsList[i].rt << "," << pointsList[i].inten << "\t";
  // std::cout << sqlstr << std::endl;
  
};

void mzMLReader3D::getPeaksOneTableRTree(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
  getConfig();
  int layer = RANGE.LAYERCOUNT-1;
  for (int i = layer; i > -1; i--) {
    layer = i;
    if (RANGE.MZSIZE[i] > mzmax - mzmin) {
      // std::cout << "RANGE.MZSIZE[i]: " << RANGE.MZSIZE[i] << ">" << "mzmax - mzmin :" << (mzmax - mzmin) << std::endl;
      layer = i + 1;
      break;
    }
  }
  std::string layerstr = num2str(layer);
  /* Create SQL statement */
  std::string sqlstr = "SELECT PEAKS.ID,MZ,RETENTIONTIME,INTENSITY FROM PEAKS,PEAKS" + layerstr + " WHERE " \
    "PEAKS.ID=PEAKS" + layerstr + ".ID AND " \
    "minMZ>" + num2str(mzmin) + " AND maxMZ<" + num2str(mzmax) + " AND minRT>" + num2str(rtmin) + " AND maxRT<" +
    num2str(rtmax) + " AND INTENSITY>" + num2str(intmin);
  sqlstr = sqlstr + " ORDER BY INTENSITY DESC LIMIT 0," + int2str(numpoints) + ";";
  sql = (char *)sqlstr.c_str();
  /* Execute SQL statement */
  rc = sqlite3_exec(db, sql, callbackPeak, (void*)data, &zErrMsg);
  if( rc != SQLITE_OK ){
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // std::cout << "Operation done successfully" << std::endl;
  }
  std::cout << std::endl;
};
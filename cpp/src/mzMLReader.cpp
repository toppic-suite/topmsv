#include "mzMLReader.hpp" 

Range RANGE;
sqlite3_stmt *stmtSp;
sqlite3_stmt *stmtPeak;
sqlite3_stmt *stmtLevelPair;
sqlite3_stmt *stmtUpdate;
sqlite3_stmt *stmtSpSumUpdate;

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

mzMLReader::mzMLReader() {
   data = (char*)("Callback function called");
};
void mzMLReader::setName(std::string fileName) {
   databaseName = fileName.replace(fileName.length() - 4,4,"db");
  // std::cout << "databaseName" << databaseName << std::endl;
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
         "INTENSITY     REAL     NOT NULL);");

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
      // std::cout << "Table PEAKS created successfully" << std::endl;
   }
};
void mzMLReader::insertSp(int scanIndex, std::string scan, double retentionTime) {
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
void mzMLReader::insertPeak(int peakIndex, int scanIndex, double intensity, double mz) {
   /* Create SQL statement */
   std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME) "  \
         "VALUES (" + int2str(peakIndex) + ", " + int2str(scanIndex) + ", " + num2str(mz) + ", " + num2str(intensity) + " ); ";
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
        std::cout << int2str(peakIndex) << ", " << int2str(scanIndex) << ", " << num2str(mz) << ", " << num2str(intensity) << std::endl;
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
void mzMLReader::getPeaks(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
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

void mzMLReader::synchronous() {
  std::string sqlstr = "PRAGMA synchronous = OFF;";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, 0);
};

void mzMLReader::openInsertStmt() {
  std::string sqlstr = "INSERT INTO SPECTRA (ID,SCAN,RETENTIONTIME,SCANLEVEL,PREC_MZ,PREC_CHARGE,PREC_INTE,PEAKSINTESUM,NEXT,PREV) VALUES (? ,? ,?, ?, ?, ?, ?, ?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtSp, 0);

  sqlstr = "INSERT INTO ScanPairs (LevelOneScanID,LevelTwoScanID) VALUES (? ,?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtLevelPair, 0);

  sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY) VALUES (? ,? ,?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);

  sqlstr = "UPDATE SPECTRA SET NEXT = ? WHERE ID = ?; ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtUpdate, 0);

  sqlstr = "UPDATE SPECTRA SET PEAKSINTESUM = ? WHERE ID = ?; ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtSpSumUpdate, 0);
};
void mzMLReader::closeInsertStmt() {
  sqlite3_finalize(stmtSp);
  sqlite3_finalize(stmtPeak);
  sqlite3_finalize(stmtLevelPair);
  sqlite3_finalize(stmtSpSumUpdate);
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
void mzMLReader::insertPeakStmt(int peakIndex, int scanIndex, double intensity, double mz) {
  // std::cout << peakIndex << "," << scanIndex << "," << intensity << "," << mz <<  std::endl;
  sqlite3_reset(stmtPeak);
  sqlite3_bind_int(stmtPeak,1,peakIndex);
  sqlite3_bind_int(stmtPeak,2,scanIndex);
  sqlite3_bind_double(stmtPeak,4,intensity);
  sqlite3_bind_double(stmtPeak,3,mz);
  int r = sqlite3_step(stmtPeak);
  if (r != SQLITE_DONE) {
    std::cout << sqlite3_errmsg(db) << std::endl;
  }
};

void mzMLReader::createIndex() {
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
  sqlstr = "CREATE INDEX scan_index ON SPECTRA (SCAN);";
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
/*  sqlstr = "CREATE INDEX peaks_index ON PEAKS (ID,SPECTRAID,MZ,INTENSITY);";
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
  sqlstr = "CREATE INDEX spectra_index ON SPECTRA (ID,RETENTIONTIME);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Spectra_index created successfully" << std::endl;
  }*/
};

/*
Use only one table.
Use only one table.
Use only one table.
Use only one table.
Use only one table.
*/

void mzMLReader::setRange(Range tmpRange) {
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
void mzMLReader::setGroup(double mz, double rt) {
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
std::string mzMLReader::getGroup(double mzmin, double mzmax, double rtmin, double rtmax) {
  std::string group_str = "";
  double mz_range = mzmax - mzmin;
  double rt_range = rtmax - rtmin;

  return group_str;
};

void mzMLReader::creatTableOneTable() {
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
void mzMLReader::getRangeOneTable() {
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
void mzMLReader::getPeaksOneTable(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
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
void mzMLReader::openInsertStmtOneTable() {
  // std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME," \
  // "MZ_GROUP1,MZ_GROUP2,MZ_GROUP3,MZ_GROUP4,MZ_GROUP5,RT_GROUP1,RT_GROUP2,RT_GROUP3,RT_GROUP4,RT_GROUP5)" \
  // " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); ";
  std::string sqlstr = "INSERT INTO PEAKS (ID,SPECTRAID,MZ,INTENSITY,RETENTIONTIME)" \
    " VALUES (?, ?, ?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);
};
void mzMLReader::closeInsertStmtOneTable() {
  sqlite3_finalize(stmtPeak);
};
void mzMLReader::insertPeakStmtOneTable(int peakIndex, int scanIndex, double mz, double intensity, double retentionTime) {
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
void mzMLReader::insertConfigOneTable() {
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
void mzMLReader::creatLayersTable() {
  std::string origin = "";
  clock_t t1 = clock();
  getConfig();
  std::cout <<"Get Config Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  for (int i = RANGE.LAYERCOUNT - 1; i > -1; i--) {
    double mzsize = RANGE.MZSIZE[i];
    double rtsize = RANGE.RTSIZE[i];
    int n = pow(2,i);
    t1 = clock();
    beginTransaction();
    createLayerTable(num2str(i));
    openInsertLayerStmt(num2str(i));
    for (int j = 0; j < n; j++) {
      for (int k = 0; k < n; k++) {
        // std::cout << "Inserting region <" << j << "," << k << "> for layer " << i << " <" << n << "," << n << ">" << std::endl;
        insertPeaksLayerStmt(origin, j, k, mzsize, rtsize);
      }
    }
    closeInsertLayerStmt();
    endTransaction();
    std::cout <<"InsertLayer Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
    t1 = clock();
    createIndexLayerTable(num2str(i));
    std::cout <<"CreateIndexLayer Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
    origin = num2str(i);
    // std::cout << "Layer " << i << " table created." << std::endl;
  }
};
void mzMLReader::getConfig() {
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

void mzMLReader::createLayerTable(std::string num) {
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
void mzMLReader::openInsertLayerStmt(std::string num) {
  std::string sqlstr = "INSERT INTO PEAKS" + num +" (ID,SPECTRAID,MZ,RETENTIONTIME,INTENSITY) VALUES (? ,? ,?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);
};
void mzMLReader::closeInsertLayerStmt() {
  sqlite3_finalize(stmtPeak);
};
void mzMLReader::insertPeaksLayerStmt(std::string origin, int j, int k, double mzsize, double rtsize) {
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
void mzMLReader::createIndexLayerTable(std::string num) {
  std::string sqlstr = "CREATE INDEX peaks_index" + num + " ON PEAKS" + num + " (MZ,RETENTIONTIME,INTENSITY);";
  sql = (char *)sqlstr.c_str();
  rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  if( rc != SQLITE_OK ){
    // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
    std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
    sqlite3_free(zErrMsg);
  }else{
    // fprintf(stdout, "Records created successfully\n");
    std::cout << "Peaks_index" + num + " created successfully" << std::endl;
  }
};
void mzMLReader::createIndexOneTable() {
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
  // sqlstr = "CREATE INDEX mz_group1_index ON PEAKS (MZ_GROUP1, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "mz1_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX mz_group2_index ON PEAKS (MZ_GROUP2, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "mz2_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX mz_group3_index ON PEAKS (MZ_GROUP3, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "mz3_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX mz_group4_index ON PEAKS (MZ_GROUP4, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "mz4_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX mz_group5_index ON PEAKS (MZ_GROUP5, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "mz5_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX rt_group1_index ON PEAKS (RT_GROUP1, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "rt1_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX rt_group2_index ON PEAKS (RT_GROUP2, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "rt2_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX rt_group3_index ON PEAKS (RT_GROUP3, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "rt3_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX rt_group4_index ON PEAKS (RT_GROUP4, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "rt4_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX rt_group5_index ON PEAKS (RT_GROUP5, INTENSITY);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "rt5_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX rt_index ON PEAKS (RETENTIONTIME);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "rt_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX Group1_index ON PEAKS (INTENSITY,MZ_GROUP1);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "Group1_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX Group2_index ON PEAKS (INTENSITY,MZ_GROUP2);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "Group2_index created successfully" << std::endl;
  // }
  // sqlstr = "CREATE INDEX Group3_index ON PEAKS (INTENSITY,MZ_GROUP3);";
  // sql = (char *)sqlstr.c_str();
  // rc = sqlite3_exec(db, sql, 0, 0, &zErrMsg);
  // if( rc != SQLITE_OK ){
  //   // fprintf(stderr, "SQL error: %d%s\n", rc, zErrMsg);
  //   std::cout << "SQL error: "<< rc << "-" << zErrMsg << std::endl;
  //   sqlite3_free(zErrMsg);
  // }else{
  //   // fprintf(stdout, "Records created successfully\n");
  //   std::cout << "Group3_index created successfully" << std::endl;
  // }
};


void mzMLReader::creatLayersTableRTree() {
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
void mzMLReader::createLayerTableRTree(std::string num) {
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
void mzMLReader::openInsertLayerStmtRTree(std::string num) {
  std::string sqlstr = "INSERT INTO PEAKS" + num +" VALUES (? ,? ,?, ?, ?); ";
  sql = (char *)sqlstr.c_str();
  sqlite3_prepare_v2(db, sql, sqlstr.length(), &stmtPeak, 0);
};
void mzMLReader::closeInsertLayerStmtRTree() {
  sqlite3_finalize(stmtPeak);
};
void mzMLReader::insertAllPeaksLayerStmtRTree() {
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
void mzMLReader::insertPeaksLayerStmtRTree(std::string origin, int j, int k, double mzsize, double rtsize) {
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

void mzMLReader::getPeaksOneTableRTree(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
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
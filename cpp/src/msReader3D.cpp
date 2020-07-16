#include "msReader3D.hpp" 
#include <iostream>
#include <fstream>
#include <chrono>

bool cmpPoints(Point p1, Point p2) {
  return p1.inten > p2.inten;
};
std::string getScan(std::string id) {
  int st = id.rfind("scan=");
  return id.substr(st+5,id.size()-st-5);
};
void getMin(double &min, double v) {
  if (min > v || min == 0) {
    min = v;
  }
  return;
}
void getMax(double &max, double v) {
  if (max < v) {
    max = v;
  }
  return;
}

msReader3D::msReader3D(std::string filename) {
	file_name = filename;

  msd_ptr_ = std::make_shared<pwiz::msdata::MSDataFile>(file_name, &readers_);
  spec_list_ptr_ =  msd_ptr_->run.spectrumListPtr;
  sl = spec_list_ptr_;
  // is = boost::shared_ptr<std::istream>(new std::ifstream(filename));
  // index = Index_mzML_Ptr(new Index_mzML(is, test_msdata));
  // sl = SpectrumList_mzML::create(is, test_msdata, index);
  RANGE.MZMIN = 0;
  RANGE.MZMAX = 0;
  RANGE.RTMIN = 0;
  RANGE.RTMAX = 0;
  RANGE.INTMIN = 0;
  RANGE.INTMAX = 0;
};


void msReader3D::createDtabasMultiLayer() {
  /*create 3d tables (peaks0, peaks1, peaks2...) in addition to original 2d tables
  two databases are going to be used, one in local disk and one in memory only
  as in-memory database can only be created as an empty db, follow same procedure as local disk db to insert data into the in-memory db
  in-memory db will be used to populate a grid vector containing a single peak for each index, and closed when finished
  multi layer tables are generated in local disk db, and peak are inserted to each layer table based on the grid vector created above.
  local disk db closed when this function ends.
  */
  clock_t t0 = clock();
  clock_t t1 = clock();

  databaseReader.openDatabase(file_name);
  databaseReader.openDatabaseInMemory(file_name);
  std::cout <<"Open database Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  databaseReader.creatTable();
  t1 = clock();
  std::cout <<"Create table: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;

  databaseReader.creatTableInMemory();
  std::cout <<"Create in memory table: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  std::vector<Point> pointsList;

  databaseReader.beginTransaction();
  databaseReader.beginTransactionInMemory();
  std::cout <<"Begin Transaction: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  databaseReader.openInsertStmt();
  databaseReader.openInsertStmtInMemory();
  databaseReader.openInsertStmtBothMs();

  int levelOneID = 0;
  int levelTwoID = 0;
  int levelOneScanID = 0;
  int levelTwoScanID = 0;
  double peaksInteSum = 0.000;

  double rtmin = DBL_MAX;
  double rtmax = 0;
  double mzmin = DBL_MAX;
  double mzmax = 0;
  double intemin = DBL_MAX;
  double intemax = 0;

  for(int i = 0; i < spSize; i++){
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      if (s == nullptr) {std::cout << "null"<<endl;}
      pwiz::msdata::SpectrumInfo spec_info(*s);
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retentionTime = scan.cvParam(MS_scan_start_time).timeInSeconds();
      int scanLevel = sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>(); // check scanLevel
      int currentScanID = std::stoi(getScan(sl->spectrumIdentity(i).id));
      int currentID = i+1;
      // intert peaks and sum intensity
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      peaksInteSum = 0.000;
      for (int j=0; j<pairs.size(); j++) {
        peaksInteSum = peaksInteSum + pairs[j].intensity;
        if (scanLevel == 1){//PEAKS0 contains level 1 data only
          databaseReader.insertPeakStmt(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime);
          databaseReader.insertPeakStmtInMemory(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime);
          count++ ;
        }

        databaseReader.insertPeakStmtBothMs(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime);
        //insert both scan level data into TOTALPEAKS

        //compare with min max values to find overall min max value
        if (pairs[j].mz < mzmin){mzmin = pairs[j].mz;}
        if (pairs[j].mz > mzmax){mzmax = pairs[j].mz;}
        if (pairs[j].intensity < intemin){intemin = pairs[j].intensity;}
        if (pairs[j].intensity > intemax){intemax = pairs[j].intensity;}
      }
      //compare with min max values to find overall min max value
      if (retentionTime < rtmin){rtmin = retentionTime;}
      if (retentionTime > rtmax){rtmax = retentionTime;}

      //ms2 data
      if (scanLevel == 2) {
        // prec_mz, prec_charge, prec_inte
        double prec_mz;
        int prec_charge;
        double prec_inte;
        if (spec_info.precursors.size() == 0) {
          prec_mz = 0;
          prec_charge = 1;
          prec_inte = 0.0;
        } 
        else {
          prec_mz = spec_info.precursors[0].mz;
          prec_charge = static_cast<int>(spec_info.precursors[0].charge);
          prec_inte = spec_info.precursors[0].intensity;
        }
        if (prec_mz < 0) {
          prec_mz = 0;
        }
        if (prec_charge  < 0) {
          prec_charge = 1;
        }
        if (prec_inte < 0) {
          prec_inte = 0.0;
        }
        databaseReader.insertSpStmt(currentID, getScan(sl->spectrumIdentity(i).id),retentionTime,scanLevel,prec_mz,prec_charge,prec_inte,peaksInteSum,NULL,levelTwoID);
        // update prev's next
        databaseReader.updateSpStmt(currentID,levelTwoID);
        levelTwoID = currentID;
        levelTwoScanID = currentScanID;
        //databaseReader.insertScanLevelPairStmt(levelOneScanID, levelTwoScanID);
      }else if(scanLevel == 1){
        databaseReader.insertSpStmt(currentID, getScan(sl->spectrumIdentity(i).id),retentionTime,scanLevel,NULL,NULL,NULL,peaksInteSum,NULL,levelOneID); 
        // update prev's next
        databaseReader.updateSpStmt(currentID,levelOneID);
        levelOneID = currentID;
        levelOneScanID = currentScanID;
      }
      
  }
  //store min max values in RANGE
  RANGE.MZMAX = mzmax;
  RANGE.MZMIN = mzmin;
  RANGE.INTMAX = intemax;
  RANGE.INTMIN = intemin;
  RANGE.RTMAX = rtmax;
  RANGE.RTMIN = rtmin;
  RANGE.COUNT = count;//peakCount

  std::cout << "mzmin:" << RANGE.MZMIN << "\tmzmax:" << RANGE.MZMAX << "\trtmin:" << RANGE.RTMIN ;
  std::cout << "\trtmax:" << RANGE.RTMAX  << "\tcount:" << RANGE.COUNT << std::endl;
  
  std::cout <<"End Insert to PEAKS0: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  databaseReader.setRange(RANGE);
  databaseReader.insertConfigOneTable();//range from getRange was not accurate
  databaseReader.endTransaction();
  databaseReader.endTransactionInMemory();
  
  std::cout <<"End Insert to CONFIG: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  //create index on peak id (for copying to each layer later)
  databaseReader.createIndexOnIdOnly();

  //t1 = clock();
  //create peaks0, peaks1.. tables
  //databaseReader.creatLayersTable();
  //std::cout << "Table create Time = " << (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;

  t1 = clock();
  //add data to peaks0, peaks1.. tables
  databaseReader.insertDataLayerTable();

  std::cout << "Insertion total Time = " << (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  
  //create indices for multi tables
  databaseReader.createIndexLayerTable();

  std::cout << "Index creationTime = " << (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;

  std::cout << "total time elapsed = " << (clock() - t0) * 1.0 / CLOCKS_PER_SEC << std::endl; 
  std::cout << "mzMLReader3D finished" << std::endl;

  databaseReader.closeDatabase();
}

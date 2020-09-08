
#include "msReader.hpp" 

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

msReader::msReader(std::string filename) {
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

void msReader::getRange() {
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  double mzmin = 0;
  double mzmax = 0;
  double rtmin = 0;
  double rtmax = 0;
  double intmin = 0;
  double intmax = 0;
  for(int i = 0; i < spSize; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retentionTime = scan.cvParam(MS_scan_start_time).timeInSeconds();
      if (rtmin == 0 || rtmin > retentionTime) 
        rtmin = retentionTime;
      if (rtmax == 0 || rtmax < retentionTime) 
        rtmax = retentionTime;
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      for (int i=0; i<pairs.size(); i++) {
        if (mzmin == 0 || mzmin > pairs[i].mz) 
          mzmin = pairs[i].mz;
        if (mzmax == 0 || mzmax < pairs[i].mz) 
          mzmax = pairs[i].mz;
        if (intmin == 0 || intmin > pairs[i].intensity) 
          intmin = pairs[i].intensity;
        if (intmax == 0 || intmax < pairs[i].intensity)
          intmax = pairs[i].intensity;
      }
      count++ ;
    }
  }
  std::cout << mzmin << "\t" << mzmax << "\t";
  std::cout << rtmin << "\t" << rtmax << "\t";
  std::cout << intmin << "\t" << intmax << "\t" << std::endl;
};
void msReader::createDtabase() { //stmt
  clock_t t0 = clock();
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  databaseReader.openDatabaseInMemory(file_name);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.creatTable();
  databaseReader.creatTableInMemory();
  std::cout <<"Create table: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
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

  int ms1scancount = 0;
  int ms1peakcount = 0;

  for(int i = 0; i < spSize; i++){
    // if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
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

      if (scanLevel == 1){
        ms1scancount++;//calculate ms1 scan count
      }

      for (int j=0; j<pairs.size(); j++) {
        count++;
        // std::cout << count << std::endl;
        peaksInteSum = peaksInteSum + pairs[j].intensity;
        if (scanLevel == 1){//PEAKS0 contains level 1 data only
          //databaseReader.insertPeakStmtMs1(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime, databaseReader.peakColor[0]);
          
          databaseReader.insertPeakStmtInMemory(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime, databaseReader.peakColor[0]);
          ms1peakcount++ ;
          
          //compare with min max values to find overall min max value
        if (pairs[j].mz < mzmin){mzmin = pairs[j].mz;}
        if (pairs[j].mz > mzmax){mzmax = pairs[j].mz;}
        if (pairs[j].intensity < intemin){intemin = pairs[j].intensity;}
        if (pairs[j].intensity > intemax){intemax = pairs[j].intensity;}
        //compare with min max values to find overall min max value
        if (retentionTime < rtmin){rtmin = retentionTime;}
        if (retentionTime > rtmax){rtmax = retentionTime;}

      }
        databaseReader.insertPeakStmt(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime);
      }
      
      // cout << currentID <<endl;
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
        databaseReader.insertScanLevelPairStmt(levelOneScanID, levelTwoScanID);
      }else if(scanLevel == 1){
        databaseReader.insertSpStmt(currentID, getScan(sl->spectrumIdentity(i).id),retentionTime,scanLevel,NULL,NULL,NULL,peaksInteSum,NULL,levelOneID); 
        // update prev's next
        databaseReader.updateSpStmt(currentID,levelOneID);
        levelOneID = currentID;
        levelOneScanID = currentScanID;
      }
      //databaseReader.insertSpStmt(i, getScan(sl->spectrumIdentity(i).id), retentionTime,scanLevel,0,0); 
      
      //databaseReader.updateSpSumStmt(currentID, 102.112654);
    // }
  }
  databaseReader.closeInsertStmt();
  
  databaseReader.closeInsertStmtInMemory();
  std::cout <<"Insert Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  //store min max values in RANGE
  RANGE.MZMAX = mzmax;
  RANGE.MZMIN = mzmin;
  RANGE.INTMAX = intemax;
  RANGE.INTMIN = intemin;
  RANGE.RTMAX = rtmax;
  RANGE.RTMIN = rtmin;
  RANGE.COUNT = ms1peakcount;//peakCount
  RANGE.SCANCOUNT = ms1scancount;
  RANGE.RTSIZE = int((RANGE.RTMAX - RANGE.RTMIN) / ms1scancount);//set rt bin size 

  t1 = clock();
  std::cout << "mzmin:" << RANGE.MZMIN << "\tmzmax:" << RANGE.MZMAX << "\trtmin:" << RANGE.RTMIN ;
  std::cout << "\trtmax:" << RANGE.RTMAX  << "\tcount:" << RANGE.COUNT << "\tmzsize:" << RANGE.MZSIZE << "\trtsize:" << RANGE.RTSIZE << std::endl;
  
  std::cout <<"End Insert to PEAKS0: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  databaseReader.setRange(RANGE);
  databaseReader.insertConfigOneTable();

  databaseReader.createIndexOnIdOnlyInMemory();//create index on PEAKS0 table by ID
  //based on PEAKS0 table in memory, inser to PEAKS0 with correct colors
  //databaseReader.setColor(RANGE.COUNT);
  databaseReader.setColor();

  databaseReader.endTransaction();
  databaseReader.endTransactionInMemory();

  //create index on peak id (for copying to each layer later)
  databaseReader.createIndexOnIdOnly();
  
  t1 = clock();
  databaseReader.insertDataLayerTable();
  std::cout <<"End Insert to all layer tables: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  
  t1 = clock();
  
  databaseReader.createIndexLayerTable();
  databaseReader.createIndex();
  std::cout <<"Creat Index: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  
  std::cout <<"total elapsed time: "<< (clock() - t0) * 1.0 / CLOCKS_PER_SEC << std::endl;
}
// get range of scan from database
void msReader::getScanRangeDB() {
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getScanRange();
  std::cout <<"Get Range: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
};
void msReader::getPeaksFromScanDB(int scan) {
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getPeaksFromScan(scan);
  std::cout <<"Get Peaks: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
}
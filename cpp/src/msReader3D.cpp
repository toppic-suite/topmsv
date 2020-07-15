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

void msReader3D::getScans(int scanLevel) {
  int count = 0;
  int spSize = sl->size();
  for(int i = 0; i < spSize; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      std::cout << i << "," << getScan(sl->spectrumIdentity(i).id) << "\t";
      count++ ;
    }
  }
  std::cout << std::endl;
};

void msReader3D::getSinglePeaks(int scanID) {
  SpectrumPtr s = sl->spectrum(scanID, true);
  std::vector<MZIntensityPair> pairs;
  s->getMZIntensityPairs(pairs);
  for (int i = 0; i < pairs.size(); i++) {
    std::cout << pairs[i].mz << "," << pairs[i].intensity << "\t";  
  }
  std::cout << std::endl;
};

void msReader3D::getRange() {
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

void msReader3D::getAllPeaks(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  std::vector<Point> pointsList;
  for(int i = 0; i < spSize; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retentionTime = scan.cvParam(MS_scan_start_time).timeInSeconds();
      if (rtmin < retentionTime) {
        vector<MZIntensityPair> pairs;
        s->getMZIntensityPairs(pairs);
        for (int i=0; i<pairs.size(); i++) {
          if (mzmin < pairs[i].mz && mzmax > pairs[i].mz && intmin < pairs[i].intensity) {
            Point point = {pairs[i].mz, retentionTime, pairs[i].intensity};
            pointsList.push_back(point);
            // std::cout << count << "," << pairs[i].mz << "," << retentionTime << "," << pairs[i].intensity << "\t";
            count++ ;
          }
        }
      }
    }
  }
  std::sort(pointsList.begin(),pointsList.end(),cmpPoints);
  for (int i = 0; i < pointsList.size(); i++) {
    if (i > numpoints - 1) break;
    std::cout << i+1 << "," << pointsList[i].mz << "," << pointsList[i].rt << "," << pointsList[i].inten << "\t";
  }
  std::cout << std::endl;
};


void msReader3D::createDtabase_normal() {
  databaseReader.openDatabase(file_name);
  databaseReader.creatTable();
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  std::vector<Point> pointsList;
  databaseReader.beginTransaction();
  for(int i = 0; i < spSize; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retentionTime = scan.cvParam(MS_scan_start_time).timeInSeconds();
      databaseReader.insertSp(i, getScan(sl->spectrumIdentity(i).id), retentionTime); 
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      for (int j=0; j<pairs.size(); j++) {
        count++ ;
        // std::cout << count << std::endl;
        databaseReader.insertPeakFor3DViz(count, i, pairs[j].intensity, pairs[j].mz, retentionTime);
      }
    }
  }
  databaseReader.endTransaction();
  databaseReader.closeDatabase();
}
void msReader3D::createDtabase() { //stmt
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.creatTable();
  std::cout <<"Create table: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  std::vector<Point> pointsList;
  databaseReader.beginTransaction();
  std::cout <<"Begin Transaction: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.openInsertStmt();
  int levelOneID = 0;
  int levelTwoID = 0;
  int levelOneScanID = 0;
  int levelTwoScanID = 0;
  double peaksInteSum = 0.000;
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
      for (int j=0; j<pairs.size(); j++) {
        count++ ;
        // std::cout << count << std::endl;
        peaksInteSum = peaksInteSum + pairs[j].intensity;
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
  std::cout <<"Insert Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.endTransaction();
  std::cout <<"End Transaction: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.createIndex();
  std::cout <<"Creat Index: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
}

// get range of scan from database
void msReader3D::getScanRangeDB() {
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

void msReader3D::getRangeDB() {
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  double mzmin = 0;
  double mzmax = 0;
  double rtmin = 0;
  double rtmax = 0;
  double intmin = 0;
  double intmax = 0;
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getRange();
  std::cout <<"Get Range: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
};
void msReader3D::getPeaksFromScanDB(int scan) {
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
void msReader3D::getAllPeaksDB(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getPeaks(mzmin, mzmax, rtmin, rtmax, numpoints, intmin);
  std::cout <<"Get Peaks: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
};
void msReader3D::getRangeFromRaw() {
  int scanLevel = 1;
  int spSize = sl->size();
  int count = 0;
  for(int i = 0; i < spSize; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retentionTime = scan.cvParam(MS_scan_start_time).timeInSeconds();
      getMin(RANGE.RTMIN,retentionTime);
      getMax(RANGE.RTMAX,retentionTime);
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      for (int j=0; j<pairs.size(); j++) {
        getMin(RANGE.MZMIN,pairs[j].mz);
        getMax(RANGE.MZMAX,pairs[j].mz);
        getMin(RANGE.INTMIN,pairs[j].intensity);
        getMax(RANGE.INTMAX,pairs[j].intensity);
        count++;
      }
    }
  }
  RANGE.COUNT = count;
  
}
/*void msReader3D::createDtabaseOneTable() { //stmt
  clock_t t1 = clock();
  getRangeFromRaw();
  std::cout <<"Get range from raw data Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.openDatabase(file_name);
  std::cout <<"Open database Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.creatTableOneTable();
  std::cout <<"Create table Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  std::vector<Point> pointsList;
  databaseReader.beginTransaction();
  std::cout <<"Begin transaction Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.openInsertStmtOneTable();
  for(int i = 0; i < spSize; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retentionTime = scan.cvParam(MS_scan_start_time).timeInSeconds();
      // databaseReader.insertSpStmt(i, getScan(sl->spectrumIdentity(i).id), retentionTime); 
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      for (int j=0; j<pairs.size(); j++) {
        count++ ;
        // std::cout << count << std::endl;
        databaseReader.insertPeakStmtOneTable(count, std::stoi(getScan(sl->spectrumIdentity(i).id)), pairs[j].mz, pairs[j].intensity, retentionTime);
      }
    }
  }
  databaseReader.closeInsertStmtOneTable();
  std::cout <<"Insert Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.endTransaction();
  std::cout <<"End Transaction Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.createIndexOneTable();
  std::cout <<"Creat Index Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.setRange(RANGE);
  std::cout <<"Set range Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.insertConfigOneTable(RANGE);
  std::cout <<"Insert range Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.creatLayersTable();
  std::cout <<"Create layers table Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
}*/
void msReader3D::getRangeDBOneTable() {
  /*int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  double mzmin = 0;
  double mzmax = 0;
  double rtmin = 0;
  double rtmax = 0;
  double intmin = 0;
  double intmax = 0;
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  // std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getRangeOneTable();
  // std::cout <<"Get Range: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  // std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();*/
};
void msReader3D::getAllPeaksDBOneTable(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
  /*int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  // std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getPeaksOneTable(mzmin, mzmax, rtmin, rtmax, numpoints, intmin);
  // std::cout <<"Get Peaks: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  // std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();*/
};
/*
void msReader3D::createDtabaseOneTableRTree() { //stmt
  clock_t t1 = clock();
  getRangeFromRaw();
  std::cout <<"Get range from raw data Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.openDatabase(file_name);
  std::cout <<"Open database Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.creatTableOneTable();
  std::cout <<"Create table Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  std::vector<Point> pointsList;
  databaseReader.beginTransaction();
  std::cout <<"Begin transaction Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.openInsertStmtOneTable();
  for(int i = 0; i < spSize; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retentionTime = scan.cvParam(MS_scan_start_time).timeInSeconds();
      // databaseReader.insertSpStmt(i, getScan(sl->spectrumIdentity(i).id), retentionTime); 
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      for (int j=0; j<pairs.size(); j++) {
        count++ ;
        // std::cout << count << std::endl;
        databaseReader.insertPeakStmtOneTable(count, std::stoi(getScan(sl->spectrumIdentity(i).id)), pairs[j].mz, pairs[j].intensity, retentionTime);
      }
    }
  }
  databaseReader.closeInsertStmtOneTable();
  std::cout <<"Insert Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.endTransaction();
  std::cout <<"End Transaction Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.createIndexOneTable();
  std::cout <<"Creat Index Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.setRange(RANGE);
  std::cout <<"Set range Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.insertConfigOneTable(RANGE);
  std::cout <<"Insert range Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.creatLayersTableRTree();
  std::cout <<"Create layers table Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
}*/

/*void msReader3D::calculateLayer(){
  /*calculate how many layers this mzML should have, based on number of total peaks*/
 /* int peaks_cnt = RANGE.COUNT;
  int layer_cnt = 0;


  while (peaks_cnt >= RANGE.MINPEAKS){
    layer_cnt++;
    peaks_cnt = peaks_cnt / (RANGE.GRIDSCALEFACTOR * 2);//approx. number of peaks in each layer table
  }
  RANGE.LAYERCOUNT = layer_cnt; //add 1 to add the smallest table (100 * 30)
}*/
void msReader3D::calculateLayer(){
  /*calculate how many layers this mzML should have, based on number of total peaks*/
  int peaks_cnt = RANGE.COUNT;
  int layer_cnt = 1;

  while (peaks_cnt >= RANGE.MINPEAKS){
    std::cout << "layer " << layer_cnt << " has peaks " << peaks_cnt << std::endl;
    layer_cnt++;
    RANGE.MAXPEAK.push_back(peaks_cnt);
    peaks_cnt = peaks_cnt / (RANGE.GRIDSCALEFACTOR * 2);//total peaks in this layer
  }
  RANGE.LAYERCOUNT = layer_cnt; 

  //if the smallest table so far is between RANGE.MINPEAKS and RANGE.MINPEAKS * 2, done.
  //if it is bigger than RANGE.MINPEAKS * 2, create another table with RANGE.MINPEAKS peaks
  //in order to speed up loading by making new smallest table with minimum peaks
  if (RANGE.MAXPEAK[RANGE.MAXPEAK.size() - 1] > RANGE.MINPEAKS * 2){
    RANGE.LAYERCOUNT = RANGE.LAYERCOUNT + 1;
  }
}

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
  getRangeFromRaw();
  std::cout <<"Get range from raw data Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

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
        count++ ;
        peaksInteSum = peaksInteSum + pairs[j].intensity;
        if (scanLevel == 1){//PEAKS0 contains level 1 data only
          databaseReader.insertPeakStmt(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime);
          databaseReader.insertPeakStmtInMemory(count, currentID, pairs[j].intensity, pairs[j].mz, retentionTime);
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
  //databaseReader.createIndexLayerTable();

  std::cout << "Index creationTime = " << (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;

  std::cout << "total time elapsed = " << (clock() - t0) * 1.0 / CLOCKS_PER_SEC << std::endl; 
  std::cout << "mzMLReader3D finished" << std::endl;

  databaseReader.closeDatabase();
}

void msReader3D::getAllPeaksDBOneTableRTree(double mzmin, double mzmax, double rtmin, double rtmax, int numpoints, double intmin) {
  /*int scanLevel = 1;
  int count = 0;
  int spSize = sl->size();
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name);
  // std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getPeaksOneTableRTree(mzmin, mzmax, rtmin, rtmax, numpoints, intmin);
  // std::cout <<"Get Peaks: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  // std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();*/
};
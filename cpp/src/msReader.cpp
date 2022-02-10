#include "msReader.hpp" 
#include <chrono>
#include <boost/filesystem.hpp>

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

msReader::msReader(std::string file_name) {
	file_name_ = file_name;

  msd_ptr_ = std::make_shared<pwiz::msdata::MSDataFile>(file_name, &readers_);
  spec_list_ptr_ =  msd_ptr_->run.spectrumListPtr;
  sl = spec_list_ptr_;
  // is = boost::shared_ptr<std::istream>(new std::ifstream(filename));
  // index = Index_mzML_Ptr(new Index_mzML(is, test_msdata));
  // sl = SpectrumList_mzML::create(is, test_msdata, index);
  Range.mz_min = 0;
  Range.mz_max = 0;
  Range.rt_min = 0;
  Range.rt_max = 0;
  Range.int_min = 0;
  Range.int_max = 0;
};

void msReader::getRange() {
  int scan_level = 1;
  int count = 0;
  int sp_size = sl->size();
  double mz_min = 0;
  double mz_max = 0;
  double rt_min = 0;
  double rt_max = 0;
  double int_min = 0;
  double int_max = 0;
  for(int i = 0; i < sp_size; i++){
    if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scan_level) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retention_time = scan.cvParam(MS_scan_start_time).timeInSeconds();
      if (rt_min == 0 || rt_min > retention_time) 
        rt_min = retention_time;
      if (rt_max == 0 || rt_max < retention_time) 
        rt_max = retention_time;
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      for (int i=0; i<pairs.size(); i++) {
        if (mz_min == 0 || mz_min > pairs[i].mz) 
          mz_min = pairs[i].mz;
        if (mz_max == 0 || mz_max < pairs[i].mz) 
          mz_max = pairs[i].mz;
        if (int_min == 0 || int_min > pairs[i].intensity) 
          int_min = pairs[i].intensity;
        if (int_max == 0 || int_max < pairs[i].intensity)
          int_max = pairs[i].intensity;
      }
      count++ ;
    }
  }
  std::cout << mz_min << "\t" << mz_max << "\t";
  std::cout << rt_min << "\t" << rt_max << "\t";
  std::cout << int_min << "\t" << int_max << "\t" << std::endl;
};
void msReader::createDtabase() { //stmt
  clock_t t0 = clock();
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name_);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.creatTable();
  std::cout <<"Create table: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  int scan_level = 1;
  int count = 0;
  int sp_size = sl->size();
  std::vector<Point> points_list;
  databaseReader.beginTransaction();
  std::cout <<"Begin Transaction: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.openInsertStmt();

  int level_one_id = 0;
  int level_two_id = 0;
  int level_one_scan_id = 0;
  int level_two_scan_id = 0;
  double peaks_int_sum = 0.000;

  double rt_min = DBL_MAX;
  double rt_max = 0;
  double mz_min = DBL_MAX;
  double mz_max = 0;
  double int_min = DBL_MAX;
  double int_max = 0;

  int ms1_scan_count = 0;
  int ms1_peak_count = 0;

  for(int i = 0; i < sp_size; i++){
    // if (sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>() == scanLevel) {
      SpectrumPtr s = sl->spectrum(i, true); // read with binary data
      if (s == nullptr) {std::cout << "null"<<endl;}
      pwiz::msdata::SpectrumInfo spec_info(*s);
      Scan dummy;
      Scan scan = s->scanList.scans.empty() ? dummy : s->scanList.scans[0];
      double retention_time = (scan.cvParam(MS_scan_start_time).timeInSeconds()) / 60; //to minutes
      int scan_level = sl->spectrum(i)->cvParam(MS_ms_level).valueAs<int>(); // check scanLevel
      double ion_time = scan.cvParam(MS_ion_injection_time).valueAs<double>();
      int current_scan_id = std::stoi(getScan(sl->spectrumIdentity(i).id));
      int current_id = i+1;
      // intert peaks and sum intensity
      vector<MZIntensityPair> pairs;
      s->getMZIntensityPairs(pairs);
      peaks_int_sum = 0.000;

      if (scan_level == 1){
        ms1_scan_count++;//calculate ms1 scan count
      }

      for (int j=0; j<pairs.size(); j++) {
        if (pairs[j].intensity > 0) {
          count++;
          // std::cout << count << std::endl;
          peaks_int_sum = peaks_int_sum + pairs[j].intensity;
          if (scan_level == 1){//PEAKS0 contains level 1 data only
            peakProperties peak;
            peak.id = count;
            peak.mz = pairs[j].mz;
            peak.inte = pairs[j].intensity;
            peak.rt = retention_time;
            peak.color = databaseReader.peak_color_[0];
            databaseReader.all_ms1_peaks_.push_back(peak);
            //databaseReader.insertPeakStmtInMemory(count, current_id, pairs[j].intensity, pairs[j].mz, retention_time, databaseReader.peak_color_[0]);
            ms1_peak_count++ ;
            
            //compare with min max values to find overall min max value
            if (pairs[j].mz < mz_min){mz_min = pairs[j].mz;}
            if (pairs[j].mz > mz_max){mz_max = pairs[j].mz;}
            if (pairs[j].intensity < int_min){int_min = pairs[j].intensity;}
            if (pairs[j].intensity > int_max){int_max = pairs[j].intensity;}
            //compare with min max values to find overall min max value
            if (retention_time < rt_min){rt_min = retention_time;}
            if (retention_time > rt_max){rt_max = retention_time;}
          }
          databaseReader.insertPeakStmt(count, getScan(sl->spectrumIdentity(i).id), pairs[j].intensity, pairs[j].mz, retention_time);
          //databaseReader.insertPeakStmt(count, current_id, pairs[j].intensity, pairs[j].mz, retention_time);
        }
      }
      
      // cout << currentID <<endl;
      if (scan_level == 2) {
        // prec_mz, prec_charge, prec_inte
        double prec_mz;
        int prec_charge;
        double prec_inte;
        double mz_low;
        double mz_high;
        if (spec_info.precursors.size() == 0) {
          prec_mz = 0;
          prec_charge = 1;
          prec_inte = 0.0;
          mz_low = 0;
          mz_high = 0;
        } 
        else {
          prec_mz = spec_info.precursors[0].mz;
          prec_charge = static_cast<int>(spec_info.precursors[0].charge);
          prec_inte = spec_info.precursors[0].intensity;

          if (s->precursors.size() > 0) {
            std::vector<pwiz::data::CVParam> cv_list = s->precursors[0].isolationWindow.cvParams;
            for (size_t i = 0; i < cv_list.size(); i++) {
              if (cv_list[i].cvid == pwiz::cv::MS_isolation_window_target_m_z) {
                prec_mz = std::stod(cv_list[i].value);
              }
              if (cv_list[i].cvid == pwiz::cv::MS_isolation_window_lower_offset) {
                mz_low = prec_mz - std::stod(cv_list[i].value);
              }
              if (cv_list[i].cvid == pwiz::cv::MS_isolation_window_upper_offset) {
                mz_high = prec_mz + std::stod(cv_list[i].value);
              }
            }
          }
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
        if (mz_low < 0) {
          mz_low = 0;
        }
        if (mz_high < 0) {
          mz_high = 0;
        }

        databaseReader.insertSpStmt(current_id, getScan(sl->spectrumIdentity(i).id),retention_time,ion_time,scan_level,prec_mz,prec_charge,prec_inte,peaks_int_sum,NULL,level_two_id, mz_low, mz_high);
        // update prev's next
        databaseReader.updateSpStmt(current_scan_id,level_two_id);
        level_two_id = current_scan_id;
        level_two_scan_id = current_scan_id;
        databaseReader.insertScanLevelPairStmt(level_one_scan_id, level_two_scan_id);
      }else if(scan_level == 1){
        databaseReader.insertSpStmt(current_id, getScan(sl->spectrumIdentity(i).id),retention_time,ion_time,scan_level,NULL,NULL,NULL,peaks_int_sum,NULL,level_one_id, NULL, NULL); 
        // update prev's next
        databaseReader.updateSpStmt(current_scan_id,level_one_id);
        level_one_id = current_scan_id;
        level_one_scan_id = current_scan_id;
      }
      //databaseReader.insertSpStmt(i, getScan(sl->spectrumIdentity(i).id), retentionTime,scanLevel,0,0); 
      
      //databaseReader.updateSpSumStmt(currentID, 102.112654);
    // }
  }
  databaseReader.closeInsertStmt();
  std::cout <<"Insert Time: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  //store min max values in Range
  Range.mz_max = mz_max;
  Range.mz_min = mz_min;
  Range.int_max = int_max;
  Range.int_min = int_min;
  Range.rt_max = rt_max;
  Range.rt_min = rt_min;
  Range.count = ms1_peak_count;//peakCount
  Range.scan_count = ms1_scan_count;

  //if user has provided custom values for rt_size and mz_size, overwrite the default values
  std::string line;
  double custom_rt_size = -1;
  double custom_mz_size = -1;
  double custom_rt_divider = -1;

  std::string sep = "/";

  #if defined (_WIN32) || defined (_WIN64) || defined (__MINGW32__) || defined (__MINGW64__)
    sep = "\\";
  #endif

  std::string root = (boost::filesystem::current_path().parent_path().parent_path()).string();
  std::string init_file_path = root + sep + "init.ini";

  ifstream initFile(init_file_path);
  if (initFile.is_open()){
    std::getline(initFile, line);

    string::size_type first_comma_pos = line.find(',');
    if (line.npos != first_comma_pos){
      std::string mz = line.substr(0, first_comma_pos);
      try{
        custom_mz_size = std::stod(mz);
      } catch(const std::exception& e){
        std::cout << "WARN: m/z size given by the user " << mz << " is invalid. Setting them to default value." << std::endl;
      }

      line = line.substr(first_comma_pos + 1);
      string::size_type second_comma_pos = line.find(',');

      if (line.npos != second_comma_pos){//check if there is a third value, rt bin size divider
        std::string rt = line.substr(0, second_comma_pos);
        std::string rt_divider = line.substr(second_comma_pos + 1);
        try{
          custom_rt_size = std::stod(rt);
        } catch(const std::exception& e){
          std::cout << "WARN: rt size given by the user " << rt << " is invalid. Setting them to default value." << std::endl;
        }
        try{
          custom_rt_divider = std::stod(rt_divider);
        } catch(const std::exception& e){
          std::cout << "WARN: rt divider given by the user " << rt_divider << " is invalid. Setting them to default value." << std::endl;
        }
      }
      else {//no third value
        std::string rt = line.substr(first_comma_pos + 1);
        try{
          custom_rt_size = std::stod(rt);
        } catch(const std::exception& e){
          std::cout << "WARN: rt size given by the user " << rt << " is invalid. Setting them to default value." << std::endl;
        }
      }
    }
    else{
      //check if only m/z value was given
      try{
        custom_mz_size = std::stod(line);
      }catch(const std::exception& e){
        std::cout << "No m/z or rt value given by the user. Setting them to default value." << std::endl;
      }
    }
    initFile.close();
  }
    
  if (custom_rt_size > 0){
    if (custom_rt_size < rt_max - rt_min){
      Range.rt_size = custom_rt_size;
    }
    else{//override the user given range if it is larger than the data range
      Range.rt_size = rt_max - rt_min;
    }
  }

  if (custom_mz_size > 0){
    if (custom_mz_size < mz_max - mz_min){
      Range.mz_size = custom_mz_size;
    }
    else{//override the user given range if it is larger than the data range
      Range.mz_size = mz_max - mz_min;
    }
  }

  if (custom_rt_divider > 0) {
    Range.rt_divider = custom_rt_divider;
    Range.rt_size = (Range.rt_max - Range.rt_min) / ms1_scan_count / Range.rt_divider;
  }
  else {
    Range.rt_size = (Range.rt_max - Range.rt_min) / ms1_scan_count;
  }
  
  std::cout <<"End getting range information: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  std::cout << "mzmin:" << Range.mz_min << "\tmzmax:" << Range.mz_max << "\trtmin:" << Range.rt_min ;
  std::cout << "\trtmax:" << Range.rt_max  << "\tcount:" << Range.count << "\tmzsize:" << Range.mz_size << "\trtsize:" << Range.rt_size << std::endl;
  databaseReader.setRange(Range);
  databaseReader.insertConfigOneTable(Range);
  std::cout <<"End insert to config table: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();

  //insert to all_ms1_peaks_ correct peak colors
  databaseReader.setColor();
  //create index on peak id (for copying to each layer later)
  //databaseReader.createIndexOnIdOnly();
  std::cout <<"End assigning colors: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.insertDataLayerTable();
  std::cout <<"End Insert to all layer tables: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.createIndexLayerTable();
  databaseReader.createIndex();
  std::cout <<"Creat Index: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;

  databaseReader.endTransaction();
  databaseReader.closeDatabase();

  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  std::cout <<"total elapsed time: "<< (clock() - t0) * 1.0 / CLOCKS_PER_SEC << std::endl;
}
// get range of scan from database
void msReader::getScanRangeDB() {
 /* clock_t t1 = clock();
  databaseReader.openDatabase(file_name_);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getScanRange();
  std::cout <<"Get Range: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();*/
};
void msReader::getPeaksFromScanDB(int scan) {
  clock_t t1 = clock();
  databaseReader.openDatabase(file_name_);
  std::cout <<"Open Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.getPeaksFromScan(scan);
  std::cout <<"Get Peaks: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
  databaseReader.closeDatabase();
  std::cout <<"Close Database: "<< (clock() - t1) * 1.0 / CLOCKS_PER_SEC << std::endl;
  t1 = clock();
}
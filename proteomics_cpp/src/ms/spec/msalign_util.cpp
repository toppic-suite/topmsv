//Copyright (c) 2014 - 2020, The Trustees of Indiana University.
//
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License.


#include "common/util/logger.hpp"
#include "ms/spec/simple_msalign_reader.hpp"
#include "ms/spec/msalign_util.hpp"

namespace toppic {

namespace msalign_util {

int countSpNum(const std::string &spectrum_file_name) {
  SimpleMsAlignReader reader(spectrum_file_name);
  int cnt = 0;
  DeconvMsPtr deconv_ms_ptr;
  while ((deconv_ms_ptr = reader.getNextMsPtr()) != nullptr) {
    cnt++;
  }
  return cnt;
}

void geneSpIndex(const std::string &spectrum_file_name) {
  int sp_num = countSpNum(spectrum_file_name); 
  std::ofstream index_output;
  std::string index_file_name = spectrum_file_name + "_index";
  index_output.open(index_file_name.c_str(), std::ios::out);
  index_output << sp_num << std::endl;
  index_output.close();
}

int getSpNum(const std::string &spectrum_file_name) {
  std::ifstream index_input;
  std::string index_file_name = spectrum_file_name + "_index";
  index_input.open(index_file_name.c_str(), std::ios::in);
  std::string line;
  std::getline(index_input, line);
  int sp_num = std::stoi(line);
  LOG_DEBUG("Get sp number " << sp_num);
  return sp_num;
}

} // namespace msalign_util

} // namespace toppic

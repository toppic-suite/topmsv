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

#ifndef TOPPIC_MS_FACTORY_EXTEND_MS_UTIL_HPP_
#define TOPPIC_MS_FACTORY_EXTEND_MS_UTIL_HPP_

#include "ms/spec/extend_ms.hpp"

namespace toppic {

namespace extend_ms_util {

std::vector<double> getExtendMassVec(ExtendMsPtr extend_ms_ptr);

std::vector<std::pair<int, int> > getExtendIntMassErrorList(const ExtendMsPtrVec &ext_ms_ptr_vec,
                                                            bool pref, double scale);

std::vector<std::pair<double, double> > getExtendMassToleranceList(ExtendMsPtr extend_ms_ptr);

}  // namespace extend_ms_util

}  // namespace toppic

#endif 

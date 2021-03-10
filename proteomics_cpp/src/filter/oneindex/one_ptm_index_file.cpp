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

#include "seq/proteoform_util.hpp"

#include "filter/massmatch/mass_match_factory.hpp"
#include "filter/oneindex/one_ptm_index_file.hpp"

namespace toppic {

namespace one_ptm_index_file {

void geneOnePtmIndexFile(const ProteoformPtrVec &proteo_ptrs,
                         OnePtmFilterMngPtr mng_ptr, std::vector<std::string> file_vec) {

  std::vector<std::vector<double>> shift_2d
      = proteoform_util::getNTermShift2D(proteo_ptrs, mng_ptr->prsm_para_ptr_->getProtModPtrVec());
  std::vector<std::vector<double>> n_term_acet_2d
      = proteoform_util::getNTermAcet2D(proteo_ptrs, mng_ptr->prsm_para_ptr_->getProtModPtrVec());
  MassMatchPtr term_index_ptr = MassMatchFactory::getPrmTermMassMatchPtr(proteo_ptrs, shift_2d,
                                                                         mng_ptr->max_proteoform_mass_,
                                                                         mng_ptr->filter_scale_);
  MassMatchPtr diag_index_ptr = MassMatchFactory::getPrmDiagMassMatchPtr(proteo_ptrs,
                                                                         mng_ptr->max_proteoform_mass_,
                                                                         mng_ptr->filter_scale_);
  std::vector<std::vector<double>> rev_shift_2d;
  std::vector<double> shift_1d(1, 0);
  for (size_t i = 0; i < proteo_ptrs.size(); i++) {
    rev_shift_2d.push_back(shift_1d);
  }
  MassMatchPtr rev_term_index_ptr = MassMatchFactory::getSrmTermMassMatchPtr(proteo_ptrs, 
                                                                             rev_shift_2d, 
                                                                             n_term_acet_2d,
                                                                             mng_ptr->max_proteoform_mass_,
                                                                             mng_ptr->filter_scale_);
  MassMatchPtr rev_diag_index_ptr = MassMatchFactory::getSrmDiagMassMatchPtr(proteo_ptrs, 
                                                                             n_term_acet_2d,
                                                                             mng_ptr->max_proteoform_mass_,
                                                                             mng_ptr->filter_scale_);

  std::string dir_name = mng_ptr->prsm_para_ptr_->getOriDbName() + "_idx";

  term_index_ptr->serializeMassMatch(file_vec[0], dir_name);
  diag_index_ptr->serializeMassMatch(file_vec[1], dir_name);
  rev_term_index_ptr->serializeMassMatch(file_vec[2], dir_name);
  rev_diag_index_ptr->serializeMassMatch(file_vec[3], dir_name); 
}

}

} /* namespace toppic */

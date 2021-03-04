// Copyright 2016, Tobias Hermann.
// https://github.com/Dobiasd/frugally-deep
// Distributed under the MIT License.
// (See accompanying LICENSE file or at
//  https://opensource.org/licenses/MIT)

#pragma once

#include "layer.hpp"

#include <string>

namespace fdeep { namespace internal
{

class add_layer : public layer
{
public:
    explicit add_layer(const std::string& name)
        : layer(name)
    {
    }
protected:
    tensor5s apply_impl(const tensor5s& input) const override
    {
        return {sum_tensor5s(input)};
    }
};

} } // namespace fdeep, namespace internal

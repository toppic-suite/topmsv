// Constants ported from TopPIC (toppic-suite): resources/base_data/*.xml and
// src/common/base/mass_constant.hpp. Values must not be rounded — the converter
// reproduces TopPIC's HTML data files bit-for-bit where possible.

// Monoisotopic residue masses from amino_acid_base.xml
export const AA_MASS: { [aa: string]: number } = {
  A: 71.0371137846,
  R: 156.10111102302,
  N: 114.04292744016,
  D: 115.0269430228,
  C: 103.0091849595,
  E: 129.04259308732,
  Q: 128.05857750468,
  G: 57.02146372008,
  H: 137.05891185752,
  I: 113.08406397816,
  L: 113.08406397816,
  K: 128.09496301462,
  M: 131.04048508854,
  F: 147.06841391364,
  P: 97.05276384912,
  S: 87.0320284037,
  T: 101.04767846822,
  W: 186.0793129501,
  Y: 163.06332853274,
  V: 99.06841391364,
  U: 150.9536363846,
  O: 132.08987763372,
};

// mass_constant.hpp
export const WATER_MASS = 18.01056468362;
export const PROTON_MASS = 1.007276466879;
export const ISOTOPE_MASS = 1.00235;

// ion_type_base.xml: neutral ion mass = break point residue mass sum + shift
export const ION_TYPE_SHIFT: { [ion: string]: number } = {
  B: 0,
  Y: 18.01056468362,
  C: 17.0265,
  Z_DOT: 1.9919,
  A: -27.9944,
  X: 43.9904,
  PREC: 18.0106,
};

export const N_TERM_ION_TYPES = new Set(['B', 'C', 'A']);

// sp_para.hpp defaults (TopPIC defaults: --mass-error-tolerance 10 ppm)
export interface MatchingParameters {
  ppo: number;           // peak tolerance, parts-per-one (10 ppm -> 1e-5)
  minTolerance: number;  // absolute floor of the peak tolerance in Da
  minMass: number;       // masses below this (or above precursor - this) are ignored
  extendMinMass: number; // peaks above this mass get +-ISOTOPE_MASS variants
}

export const DEFAULT_PARAMETERS: MatchingParameters = {
  ppo: 10 * 1e-6,
  minTolerance: 0.01,
  minMass: 50.0,
  extendMinMass: 5000.0,
};

// PrsmViewMng
export const DECIMAL_POINT_NUM = 2;   // intensities
export const PRECISE_POINT_NUM = 4;   // masses / mz

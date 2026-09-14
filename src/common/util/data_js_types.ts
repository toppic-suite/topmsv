/**
 * Shapes of the generated data files the pages load through <script> tags,
 * each of which assigns one global:
 *
 *   prsm_data           data_js/... files (src/server/convert/builder.ts, a
 *                       port of TopPIC's anno_xml_util + xml2json): every
 *                       scalar is a string, a one-element list collapses to
 *                       its element (OneOrMany), an empty element is null.
 *                       Read lists with getJsonList() (parse_json/parse_util.ts).
 *   ms1_data / ms2_data topfd/ms{1,2}_json/spectrum<N>.js (src/server/spectrumJs.ts)
 *
 * This file only declares types (its emitted .js is empty).
 */

/** xml2json collapse: a list with one element is written as the element */
type OneOrMany<T> = T | T[];

interface DataJsMatchedIon {
  ion_type: string;
  match_shift: string;
  theoretical_mass: string;
  ion_position: string;
  ion_display_position: string;
  ion_sort_name: string;
  ion_left_position: string;
  mass_error: string;
  ppm: string;
}

/** deconvoluted peak (prsm.ms.peaks.peak); peak_id indexes the spectrum's envelopes */
interface DataJsPeak {
  spec_id: string;
  peak_id: string;
  monoisotopic_mass: string;
  monoisotopic_mz: string;
  intensity: string;
  charge: string;
  matched_ions_num?: string;
  matched_ions?: { matched_ion: OneOrMany<DataJsMatchedIon> };
}

interface DataJsMsHeader {
  spectrum_file_name: string;
  ms1_ids: string;    // space-separated ids
  ms1_scans: string;
  ids: string;
  scans: string;
  precursor_mono_mass: string;
  precursor_charge: string;
  precursor_mz: string;
  feature_inte?: string;
}

interface DataJsResidue {
  position: string;
  acid: string;
}

interface DataJsMatchedPeak {
  ion_type: string;
  ion_position: string;
  ion_display_position: string;
  spec_id: string;
  peak_id: string;
  peak_charge: string;
}

interface DataJsCleavage {
  position: string;
  exist_n_ion: string;    // "0" / "1"
  exist_c_ion: string;
  matched_peaks: { matched_peak: OneOrMany<DataJsMatchedPeak> } | null;
}

interface DataJsPtmOccurence {
  left_pos: string;
  right_pos: string;
  anno: string;
}

interface DataJsPtm {
  ptm_type: string;       // "Fixed" | "Protein variable" | "Variable"
  ptm: { abbreviation: string; unimod: string; mono_mass: string };
  occurence: OneOrMany<DataJsPtmOccurence>;
}

interface DataJsMassShift {
  id: string;
  left_position: string;
  right_position: string;
  shift: string;
  anno: string;
  shift_type: string;     // "unexpected" | "variable ptm"
}

interface DataJsAnnotation {
  protein_length: string;
  first_residue_position: string;
  last_residue_position: string;
  annotated_seq: string;
  residue: OneOrMany<DataJsResidue>;
  cleavage: OneOrMany<DataJsCleavage>;
  ptm?: OneOrMany<DataJsPtm>;
  mass_shift?: OneOrMany<DataJsMassShift>;
}

interface DataJsAnnotatedProtein {
  sequence_id: string;
  proteoform_id: string;
  sequence_name: string;
  sequence_description: string;
  proteoform_mass: string;
  n_acetylation: string;
  unexpected_shift_number: string;
  annotation: DataJsAnnotation;
}

/**
 * Full PrSM record. `ms.peaks` is present in prsm<N>.js and proteoform<N>.js
 * and absent in protein<N>.js.
 */
interface DataJsPrsm {
  prsm_id: string;
  p_value: string;
  e_value: string;
  fdr: string;
  matched_fragment_number: string;
  matched_peak_number: string;
  ms: {
    ms_header: DataJsMsHeader;
    peaks?: { peak: OneOrMany<DataJsPeak> };
  };
  annotated_protein: DataJsAnnotatedProtein;
}

interface DataJsCompatibleProteoform {
  sequence_id: string;
  sequence_name: string;
  sequence_description: string;
  proteoform_id: string;
  prsm_number: string;
  prsm: OneOrMany<DataJsPrsm>;
}

interface DataJsProtein {
  sequence_id: string;
  sequence_name: string;
  sequence_description: string;
  compatible_proteoform_number: string;
  compatible_proteoform: OneOrMany<DataJsCompatibleProteoform>;
}

/** data_js/prsms/prsm<N>.js */
interface PrsmFilePayload {
  prsm: DataJsPrsm;
}

/** data_js/proteoforms/proteoform<N>.js */
interface ProteoformFilePayload {
  compatible_proteoform: DataJsCompatibleProteoform;
}

/** data_js/proteins/protein<N>.js */
interface ProteinFilePayload {
  protein: DataJsProtein;
}

/**
 * The data_js file the page loaded. Its shape depends on the page (the file
 * payloads above, or the prsms.js / proteins.js index files), so read it
 * through a cast to the payload of the file the page requested.
 */
declare var prsm_data: any;

// ---------------------------------------------------- topfd spectrum files

interface SpectrumJsPeak {
  mz: string;
  intensity: string;
}

interface SpectrumJsEnvPeak {
  mz: number;
  intensity: number;
}

interface SpectrumJsEnvelope {
  id: number;
  mono_mass: number;
  charge: number;
  ref_mass?: number;      // reference-isotope mass; newer TopFD only
  env_peaks: SpectrumJsEnvPeak[];
}

interface SpectrumJsPayload {
  id: number;
  scan: number;
  retention_time: number;
  target_mz: number;      // -1 for MS1
  min_mz: number;
  max_mz: number;
  n_ion_type?: string;    // MS2 only
  c_ion_type?: string;
  peaks: SpectrumJsPeak[];
  envelopes: SpectrumJsEnvelope[];
}

declare var ms1_data: SpectrumJsPayload;
declare var ms2_data: SpectrumJsPayload;

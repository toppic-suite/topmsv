/**
 * Builds, for the protein page, the best PrSM (lowest e-value) of every
 * proteoform of the protein in prsm_data (data_js/proteins/protein<N>.js),
 * plus each proteoform's PrSM count.
 */
function geneProteinObj(callback: (prsms: Prsm[], prsmCnts: number[]) => void): void {
  let prsms: Prsm[] = [];
  let prsmCnts: number[] = [];
  let protein: DataJsProtein = (prsm_data as ProteinFilePayload).protein;
  for (let compatibleProteoform of getJsonList(protein.compatible_proteoform)) {
    let prsmList: DataJsPrsm[] = getJsonList(compatibleProteoform.prsm);
    let [, , bestPrsmId] = getBestPrsm(prsmList);
    let bestPrsm: DataJsPrsm | undefined = prsmList.find((p) => p.prsm_id == bestPrsmId);
    if (!bestPrsm) {
      continue;
    }
    prsms.push(bestPrsmToModel(bestPrsm));
    // also save the total number of PrSMs of the proteoform
    prsmCnts.push(prsmList.length);
  }
  callback(prsms, prsmCnts);
}

/** Prsm model object of a protein<N>.js PrSM (header only: no spectra, no matched peaks) */
function bestPrsmToModel(prsm: DataJsPrsm): Prsm {
  let prot: DataJsAnnotatedProtein = prsm.annotated_protein;
  let [fixedPtms, protVarPtms, variablePtms] = json2Ptms(prsm);
  let massShifts: MassShift[] = json2MassShifts(prsm);
  let residues: DataJsResidue[] = getJsonList(prot.annotation.residue);
  let sequence: string = getAminoAcidSequence(0, residues.length - 1, residues);
  let breakPoints: BreakPoints[] = json2BreakPoints(prsm, parseInt(prot.annotation.first_residue_position));
  let proteoformObj = new Proteoform(prot.proteoform_id, prot.sequence_name, prot.sequence_description, sequence,
    prot.sequence_id, parseInt(prot.annotation.first_residue_position),
    parseInt(prot.annotation.last_residue_position), parseFloat(prot.proteoform_mass),
    massShifts, fixedPtms, protVarPtms, variablePtms);
  let header: DataJsMsHeader = prsm.ms.ms_header;
  return new Prsm(prsm.prsm_id, proteoformObj, null, null, breakPoints, [], header.spectrum_file_name,
    asDisplayNumber(prsm.e_value), asDisplayNumber(prsm.fdr),
    header.feature_inte !== undefined ? asDisplayNumber(header.feature_inte) : undefined,
    asDisplayNumber(header.precursor_mono_mass), parseInt(prsm.matched_fragment_number));
}

/**
 * Get the e-value, precursor mass and id of the PrSM with the lowest e-value
 * @param prsmList - the PrSMs of one proteoform
 */
function getBestPrsm(prsmList: DataJsPrsm[]): [string, string, string] {
  let best: DataJsPrsm = prsmList[0];
  let bestEValue: number = parseFloat(best.e_value);
  for (let i = 1; i < prsmList.length; i++) {
    let eValue: number = parseFloat(prsmList[i].e_value);
    if (bestEValue >= eValue) {
      bestEValue = eValue;
      best = prsmList[i];
    }
  }
  return [best.e_value, best.ms.ms_header.precursor_mono_mass, best.prsm_id];
}

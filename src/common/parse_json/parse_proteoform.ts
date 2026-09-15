/**
 * Builds, for the proteoform page, one Prsm per PrSM of the proteoform in
 * prsm_data (data_js/proteoforms/proteoform<N>.js): the deconvoluted peaks
 * of its spectrum and one matched pair per matched ion, which the page
 * counts as "# all masses" / "# matched masses".
 */
function geneProteoformObj(callback: (prsms: Prsm[]) => void): void {
  let prsms: Prsm[] = [];
  let proteoform: DataJsCompatibleProteoform = (prsm_data as ProteoformFilePayload).compatible_proteoform;
  for (let prsm of getJsonList(proteoform.prsm)) {
    let proteoformObj = new Proteoform(proteoform.proteoform_id, proteoform.sequence_name,
      proteoform.sequence_description, "", proteoform.sequence_id, -1, -1,
      parseFloat(prsm.ms.ms_header.precursor_mono_mass), [], [], [], []);
    let matchedPairList: MatchedPeakEnvelopePair[] = [];
    let peakList: Peak[] = [];
    for (let peak of getJsonList(prsm.ms.peaks?.peak)) {
      let peakObj = new Peak(peak.peak_id, parseFloat(peak.monoisotopic_mass), parseFloat(peak.monoisotopic_mz),
        parseFloat(peak.intensity), parseFloat(peak.monoisotopic_mass), parseInt(peak.charge), peak.spec_id);
      peakList.push(peakObj);
      for (let matchedIon of getJsonList(peak.matched_ions?.matched_ion)) {
        let ionObj = new Ion(matchedIon.ion_type + matchedIon.ion_display_position, matchedIon.ion_type, "",
          parseFloat(matchedIon.match_shift));
        matchedPairList.push(new MatchedPeakEnvelopePair(parseFloat(matchedIon.theoretical_mass), peakObj, ionObj));
      }
    }
    let spectrum = new Spectrum("", prsm.ms.ms_header.scans, -1, peakList, [], [], [], [], -1);
    prsms.push(new Prsm(prsm.prsm_id, proteoformObj, null, [spectrum], [], matchedPairList, "",
      prsm.e_value, undefined, undefined, undefined, parseInt(prsm.matched_fragment_number)));
  }
  callback(prsms);
}

/**
 * Builds the Prsm model object of the PrSM page and the inspect page from
 * the prsm_data global (data_js/prsms/prsm<N>.js) and the MS1 / MS2 spectrum
 * files (topfd/ms{1,2}_json/spectrum<N>.js) it loads through <script> tags.
 */

/** Envelope model object of one spectrum-file envelope */
function envelopeFromJson(env: SpectrumJsEnvelope): Envelope {
  let envObj = new Envelope(env.mono_mass, env.charge);
  if (env.ref_mass != null) {
    envObj.setRefMass(env.ref_mass);
  }
  for (let j = 0; j < env.env_peaks.length; j++) {
    let peak = env.env_peaks[j];
    envObj.addPeaks(new Peak(j.toString(), peak.mz, peak.mz, peak.intensity));
  }
  return envObj;
}

class ParsePrsm {
  private drawMs1Spec_: boolean;
  private drawMs2Spec_: boolean;
  private ms1SpecPath_: string | null;
  private ms2SpecPath_: string | null;

  constructor(drawMs1Spec: boolean = false, ms1SpecPath: string | null = null,
              drawMs2Spec: boolean = false, ms2SpecPath: string | null = null) {
    this.drawMs1Spec_ = drawMs1Spec;
    this.drawMs2Spec_ = drawMs2Spec;
    this.ms1SpecPath_ = ms1SpecPath;
    this.ms2SpecPath_ = ms2SpecPath;
  }

  geneDataObj(callback: (prsm: Prsm) => void): void {
    let protObj: Proteoform = this.geneProteoform();
    this.genePrsm(protObj, callback);
  }

  genePrsm(proteoformObj: Proteoform, callback: (prsm: Prsm) => void): void {
    let prsm: DataJsPrsm = (prsm_data as PrsmFilePayload).prsm;
    let prot: DataJsAnnotatedProtein = prsm.annotated_protein;
    let breakPoints: BreakPoints[] = json2BreakPoints(prsm, parseInt(prot.annotation.first_residue_position));
    let [nIons, cIons] = this.parseIons();
    this.geneMs2Spectrum(nIons, cIons, (ms2Spec, targetMz, minMz, maxMz) => {
      let matchedPeakEnvPair: MatchedPeakEnvelopePair[] = [];
      ms2Spec.forEach((spectrum) => {
        matchedPeakEnvPair = matchedPeakEnvPair.concat(
          this.geneMatchedPeakEnvelopePairs(spectrum.getSpectrumId(), spectrum.getEnvs()));
      });
      this.geneMs1Spectrum(nIons, cIons, targetMz, minMz, maxMz, (ms1Spec) => {
        callback(new Prsm(prsm.prsm_id, proteoformObj, ms1Spec, ms2Spec, breakPoints, matchedPeakEnvPair,
          prsm.ms.ms_header.spectrum_file_name, prsm.e_value, prsm.fdr,
          undefined, undefined, parseInt(prsm.matched_fragment_number)));
      });
    });
  }

  geneProteoform(): Proteoform {
    let prsm: DataJsPrsm = (prsm_data as PrsmFilePayload).prsm;
    let prot: DataJsAnnotatedProtein = prsm.annotated_protein;
    let [fixedPtms, protVarPtms, variablePtms] = json2Ptms(prsm);
    let massShifts: MassShift[] = json2MassShifts(prsm);
    let residues: DataJsResidue[] = getJsonList(prot.annotation.residue);
    let sequence: string = getAminoAcidSequence(0, residues.length - 1, residues);
    return new Proteoform(prot.proteoform_id, prot.sequence_name, prot.sequence_description, sequence,
      prot.sequence_id, parseInt(prot.annotation.first_residue_position),
      parseInt(prot.annotation.last_residue_position), parseFloat(prot.proteoform_mass),
      massShifts, fixedPtms, protVarPtms, variablePtms);
  }

  /**
   * Load the precursor MS1 spectrum file (the first of ms1_ids) and build
   * its Spectrum; the MS2 target / min / max m/z mark the precursor window.
   */
  geneMs1Spectrum(nIons: Ion[], cIons: Ion[], targetMz: number | undefined, minMz: number | undefined,
                  maxMz: number | undefined, callback: (spec: Spectrum | null) => void): void {
    if (!this.drawMs1Spec_) {
      callback(null);
      return;
    }
    if (this.ms1SpecPath_ == null) {
      console.error("invalid path for ms1 spectrum file");
      callback(null);
      return;
    }
    let prsm: DataJsPrsm = (prsm_data as PrsmFilePayload).prsm;
    let ms1SpecId: string = prsm.ms.ms_header.ms1_ids.split(" ")[0];
    let script: HTMLScriptElement = document.createElement('script');
    script.src = this.ms1SpecPath_ + "spectrum" + ms1SpecId + ".js";
    document.head.appendChild(script);
    script.onload = function () {
      // ms1_data is the global the just-loaded file assigned
      let peaks: Peak[] = ms1_data.peaks.map((p, i) =>
        new Peak(i.toString(), parseFloat(p.mz), parseFloat(p.mz), parseFloat(p.intensity)));
      let envelopes: Envelope[] = ms1_data.envelopes.map(envelopeFromJson);
      callback(new Spectrum(ms1_data.id.toString(), ms1_data.scan.toString(), 1, peaks, null, envelopes,
        nIons, cIons, parseFloat(prsm.ms.ms_header.precursor_mono_mass),
        parseFloat(prsm.ms.ms_header.precursor_charge), targetMz, minMz, maxMz));
    };
  }

  /**
   * Load every MS2 spectrum file of the PrSM (ms_header.ids) and build their
   * Spectrum objects sorted by scan; the target / min / max m/z of the first
   * one are passed on for the MS1 precursor window.
   */
  geneMs2Spectrum(nIons: Ion[], cIons: Ion[],
                  callback: (specs: Spectrum[], targetMz?: number, minMz?: number, maxMz?: number) => void): void {
    if (!this.drawMs2Spec_) {
      callback([]);
      return;
    }
    let ms2SpecPath: string | null = this.ms2SpecPath_;
    if (ms2SpecPath == null) {
      console.error("invalid path for ms2 spectrum file");
      callback([]);
      return;
    }
    let prsm: DataJsPrsm = (prsm_data as PrsmFilePayload).prsm;
    let specIdList: string[] = prsm.ms.ms_header.ids.split(" ");
    let scanIdList: string[] = prsm.ms.ms_header.scans.split(" ");
    if (typeof (ms2ScanList) != "undefined") {
      scanIdList.forEach((scan) => {
        ms2ScanList.push(scan);
      });
    }
    let specList: SpectrumJsPayload[] = [];
    let cnt: number = 0;
    for (let i = 0; i < specIdList.length; i++) {
      let script: HTMLScriptElement = document.createElement('script');
      script.src = ms2SpecPath + "spectrum" + specIdList[i] + ".js";
      document.head.appendChild(script);
      script.onload = () => {
        // ms2_data is the global the just-loaded file assigned; tag it with
        // the spectrum id it was requested under
        ms2_data.id = parseInt(specIdList[i]);
        specList.push(ms2_data);
        cnt = cnt + 1;
        if (cnt < specIdList.length) {
          return;
        }
        specList.sort((x, y) => x.scan - y.scan);
        let specObjList: Spectrum[] = specList.map((spec) => this.ms2SpectrumFromJson(prsm, spec, nIons, cIons));
        callback(specObjList, specList[0].target_mz, specList[0].min_mz, specList[0].max_mz);
      };
    }
  }

  /** Spectrum model object of one MS2 spectrum file, with the PrSM's deconvoluted peaks of that spectrum */
  private ms2SpectrumFromJson(prsm: DataJsPrsm, spec: SpectrumJsPayload, nIons: Ion[], cIons: Ion[]): Spectrum {
    let peaks: Peak[] = spec.peaks.map((p, k) =>
      new Peak(k.toString(), parseFloat(p.mz), parseFloat(p.mz), parseFloat(p.intensity)));
    let envelopes: Envelope[] = spec.envelopes.map(envelopeFromJson);
    let deconvPeaks: Peak[] = [];
    for (let peak of getJsonList(prsm.ms.peaks?.peak)) {
      if (Number(peak.spec_id) !== spec.id) {
        continue;
      }
      let deconvPeak = new Peak(peak.peak_id, parseFloat(peak.monoisotopic_mass), parseFloat(peak.monoisotopic_mz),
        parseFloat(peak.intensity), parseFloat(peak.monoisotopic_mass), parseInt(peak.charge), peak.spec_id);
      // deconvoluted peak ids index the spectrum's envelope list
      let env: Envelope | undefined = envelopes[parseInt(peak.peak_id)];
      if (env) {
        deconvPeak.setRefMz(env.getRefMz());
      }
      deconvPeaks.push(deconvPeak);
    }
    // ion types not identified from the prsm file: take the spectrum's
    // (same fallback as the server's spectrum writer)
    if (nIons.length < 1) {
      let nIonType: string = spec.n_ion_type ?? "B";
      nIons.push(new Ion(nIonType, nIonType, "N", -1));
    }
    if (cIons.length < 1) {
      let cIonType: string = spec.c_ion_type ?? "Y";
      cIons.push(new Ion(cIonType, cIonType, "C", -1));
    }
    return new Spectrum(spec.id.toString(), spec.scan.toString(), 1, peaks, deconvPeaks, envelopes, nIons, cIons,
      parseFloat(prsm.ms.ms_header.precursor_mono_mass), parseFloat(prsm.ms.ms_header.precursor_charge),
      parseFloat(prsm.ms.ms_header.precursor_mz));
  }

  /**
   * Ion types matched in the prsm file, split by terminal: N-terminal
   * (A, B, C) and C-terminal (X, Y, Z) ions, in the order the peaks list them.
   */
  parseIons(): [Ion[], Ion[]] {
    let nIons: Ion[] = [];
    let cIons: Ion[] = [];
    let prsm: DataJsPrsm = (prsm_data as PrsmFilePayload).prsm;
    for (let peak of getJsonList(prsm.ms.peaks?.peak)) {
      if (!(parseInt(peak.matched_ions_num ?? "0") > 0)) {
        continue;
      }
      for (let ion of getJsonList(peak.matched_ions?.matched_ion)) {
        let ionTerm: string;
        if (ion.ion_type == "X" || ion.ion_type == "Y" || ion.ion_type == "Z") {
          ionTerm = "C";
        }
        else if (ion.ion_type == "A" || ion.ion_type == "B" || ion.ion_type == "C") {
          ionTerm = "N";
        }
        else {
          continue;
        }
        let ionObj = new Ion(ion.ion_type + ion.ion_display_position, ion.ion_type, ionTerm,
          parseFloat(ion.match_shift), parseFloat(ion.mass_error), parseFloat(ion.ppm));
        if (ionTerm == "C") {
          cIons.push(ionObj);
        }
        else {
          nIons.push(ionObj);
        }
      }
    }
    return [nIons, cIons];
  }

  /** One matched pair per matched ion of the deconvoluted peaks of spectrum specId */
  geneMatchedPeakEnvelopePairs(specId: string, envelopes: Envelope[]): MatchedPeakEnvelopePair[] {
    let matchedPairList: MatchedPeakEnvelopePair[] = [];
    let prsm: DataJsPrsm = (prsm_data as PrsmFilePayload).prsm;
    for (let element of getJsonList(prsm.ms.peaks?.peak)) {
      if (element.matched_ions_num === undefined || element.spec_id != specId) {
        continue;
      }
      let peakId: number = parseInt(element.peak_id);
      let envPeaks: Peak[] = envelopes[peakId].getPeaks();
      envPeaks.sort((x, y) => d3.descending(x.getIntensity(), y.getIntensity()));
      for (let matchedIon of getJsonList(element.matched_ions?.matched_ion)) {
        let ionType: string = matchedIon.ion_type;
        if (ionType == "Z_DOT") {
          ionType = "Z˙";
        }
        let ionText: string = ionType + matchedIon.ion_display_position;
        let matchedPeakObj = new Peak(element.peak_id, parseFloat(element.monoisotopic_mz), parseFloat(element.monoisotopic_mz),
          parseFloat(element.intensity), parseFloat(element.monoisotopic_mass), parseInt(element.charge), element.spec_id);
        matchedPeakObj.setRefMz(envelopes[peakId].getRefMz());
        let ionTerm: string = "";
        let firstChar: string = matchedIon.ion_type[0];
        if (firstChar == "X" || firstChar == "Y" || firstChar == "Z") {
          ionTerm = "C";
        }
        else if (firstChar == "A" || firstChar == "B" || firstChar == "C") {
          ionTerm = "N";
        }
        let matchedIonObj = new Ion(ionText, ionType, ionTerm, parseFloat(matchedIon.match_shift),
          parseFloat(matchedIon.mass_error), parseFloat(matchedIon.ppm));
        let matchedPair = new MatchedPeakEnvelopePair(parseFloat(matchedIon.theoretical_mass), matchedPeakObj, matchedIonObj);
        matchedPair.addEnvelope(envelopes[peakId]);
        matchedPairList.push(matchedPair);
      }
    }
    return matchedPairList;
  }
}

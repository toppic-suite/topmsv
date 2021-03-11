class Prsm {
  constructor(id, proteoform, ms1Spec, ms2Spec, breakPoints, matchedPeaks = -1, matchedIons = -1, unexpectedMod = -1, eValue = -1, qValue = -1) {
    this.id_ = id;
    this.proteoform_ = proteoform;
    this.ms1Spec_ = ms1Spec;
    this.ms2Spec_ = ms2Spec;
    this.breakPoints_ = breakPoints;
    this.matchedPeaks_ = parseInt(matchedPeaks);
    this.matchedIons_ = parseInt(matchedIons);
    this.unexpectedMod_ = parseInt(unexpectedMod); 
    this.eValue_ = parseFloat(eValue);
    this.qValue_ = parseFloat(qValue);
  }
  getId() {
    return this.id_;
  }
  getProteoform() {
    return this.proteoform_;
  }
  getMs1Spectra() {
    return this.ms1Spec_;
  }
  getMs2Spectra() {
    return this.ms2Spec_;
  }
  getMatchedPeakCount() {
    return this.matchedPeaks_;
  }
  getMatchedFragIonCount() {
    return this.matchedIons_;
  }
  getUnexpectedModCount() {
    return this.unexpectedMod_;
  }
  getEValue() {
    return this.eValue_;
  }
  getQValue() {
    return this.qValue_;
  }
  getBreakPoints() {
    return this.breakPoints_;
  }
  setBreakPoints(breakPoints) {
    this.breakPoints_ = breakPoints;
  }
  setProteoform(proteoform) {
    this.proteoform_ = proteoform;
  }
}
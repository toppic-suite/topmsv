class Prsm {
  matchedPeaks_ = [];
  matchedIons_ = [];

  constructor(id, proteoform, ms1Spec, ms2Spec, breakPoints, eValue = -1, qValue = -1) {
    this.id_ = id;
    this.proteoform_ = proteoform;
    this.ms1Spec_ = ms1Spec;
    this.ms2Spec_ = ms2Spec;
    this.breakPoints_ = breakPoints;
    //combine matched* into one matchedpeakpair
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
    return this.matchedPeaks_.length;
  }
  getMatchedFragIonCount() {
    return this.matchedIons_.length;
  }
  getUnexpectedModCount() {
    let protObj = this.getProteoform();
    let unexpectedMod = protObj.getUnknownMassShift();
    //can be retrieved from proteoform
    return unexpectedMod.length;
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
  setMatchedPeakEnvelopePairs(matchedPairs) {
    let ionsNoDup = [];
    matchedPairs.forEach(pair => {
      this.matchedPeaks_.push(pair.getPeak());
      let ion = pair.getIon().getId();
      if (ionsNoDup.indexOf(ion) < 0) {
        this.matchedIons_.push(pair.getIon());
        ionsNoDup.push(ion);
      } 
    })
  }
}
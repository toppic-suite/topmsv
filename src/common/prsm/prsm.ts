class Prsm {
  private matchedPeaks_: Peak[] = [];
  private matchedIons_: Ion[] = [];
  private matchedPeakEnvelopePair_: MatchedPeakEnvelopePair[] = [];
  private id_: string;
  private proteoform_: Proteoform;
  private ms1Spec_: Spectrum | null;
  private ms2Spec_: Spectrum[] | null;
  private breakPoints_: BreakPoints[];
  // e-value, FDR, feature intensity and precursor mass are the formatted
  // strings TopPIC wrote ("1.95e-21", "N/A", "1.23e+08", "10278.5000");
  // the pages display them verbatim. Absent values are "N/A".
  private eValue_: string;
  private qValue_: string;
  private fileName_: string;
  private featureInte_: string | undefined;
  private precMass_: string | undefined;
  private fragIonCount_: number | undefined;

  constructor(id: string, proteoform: Proteoform, ms1Spec: Spectrum | null, ms2Spec: Spectrum[] | null, 
    breakPoints: BreakPoints[], matchedPeakEnvelopePair: MatchedPeakEnvelopePair[] = [],  fileName: string = "", eValue: string = "N/A", qValue: string = "N/A",
    featureInte?: string, precMass?: string, fragIonCount?: number) {
    this.id_ = id;
    this.proteoform_ = proteoform;
    this.ms1Spec_ = ms1Spec;
    this.ms2Spec_ = ms2Spec;
    this.breakPoints_ = breakPoints;
    this.matchedPeakEnvelopePair_ = matchedPeakEnvelopePair;
    this.fileName_ = fileName;
    this.eValue_ = eValue;
    this.qValue_ = qValue;
    this.fragIonCount_ = fragIonCount;
    if (featureInte) {
      this.featureInte_ = featureInte;
    }
    if (precMass) {
        this.precMass_ = precMass;
    }
  }
  getId(): string {
    return this.id_;
  }
  getFragIonCount(): number | undefined {
    return this.fragIonCount_;
  }
  getfileName(): string {
    return this.fileName_;
  }
  getProteoform(): Proteoform {
    return this.proteoform_;
  }
  getMs1Spectra(): Spectrum | null{
    return this.ms1Spec_;
  }
  getMs2Spectra(): Spectrum[] | null{
    return this.ms2Spec_;
  }
  getMatchedPeakCount(): number {
    return this.getMatchedPeakEnvelopePairs().length;
  }
  getUnexpectedModCount(): number {
    let protObj: Proteoform = this.getProteoform();
    let unexpectedMod: MassShift[] = protObj.getUnknownMassShift();
    return unexpectedMod.length;
  }
  getEValue(): string {
    return this.eValue_;
  }
  getQValue(): string {
    return this.qValue_;
  }
  getFeatureInte(): string | undefined {
    return this.featureInte_;
  }
  getPrecMass(): string | undefined {
    return this.precMass_;
  }
  getBreakPoints(): BreakPoints[] {
    return this.breakPoints_;
  }
  getMatchedPeakEnvelopePairs(): MatchedPeakEnvelopePair[] {
    return this.matchedPeakEnvelopePair_;
  }
  setBreakPoints(breakPoints: BreakPoints[]): void {
    this.breakPoints_ = breakPoints;
  }
  setProteoform(proteoform: Proteoform): void {
    this.proteoform_ = proteoform;
  }
}
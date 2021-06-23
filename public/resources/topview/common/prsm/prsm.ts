type BreakPoints = {
  "anno": string,
  "existCIon": boolean,
  "existNIon": boolean,
  "masses": {"charge": number, "ionDispPos": number, "ionType": string}[],
  "position": string
}

class Prsm {
  private matchedPeaks_: Peak[] = [];
  private matchedIons_: Ion[] = [];
  private matchedPeakEnvelopePair_: MatchedPeakEnvelopePair[] = [];
  private id_: string;
  private proteoform_: Proteoform;
  private ms1Spec_: Spectrum | null;
  private ms2Spec_: Spectrum[] | null;
  private breakPoints_: BreakPoints[];
  private eValue_: number;
  private qValue_: number;
  private fileName_: string;

  constructor(id: string, proteoform: Proteoform, ms1Spec: Spectrum | null, ms2Spec: Spectrum[] | null, 
    breakPoints: BreakPoints[], matchedPeakEnvelopePair: MatchedPeakEnvelopePair[] = [],  fileName: string = "", eValue: number = -1, qValue: number = -1) {
    this.id_ = id;
    this.proteoform_ = proteoform;
    this.ms1Spec_ = ms1Spec;
    this.ms2Spec_ = ms2Spec;
    this.breakPoints_ = breakPoints;
    /*if (matchedPeakEnvelopePair.length > 0) {
      this.setMatchedPeakEnvelopePairs(matchedPeakEnvelopePair);
    }*/
    this.matchedPeakEnvelopePair_ = matchedPeakEnvelopePair;
    this.fileName_ = fileName;
    this.eValue_ = eValue;
    this.qValue_ = qValue;
  }
  getId(): string {
    return this.id_;
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
    let peaksCnt: number = 0;
    this.getMatchedPeakEnvelopePairs().forEach(pair => {
      peaksCnt++;
    })
    return peaksCnt;
  }
  getMatchedFragIonCount(): number {
    let alreadyAddedIons: string[] = [];
    let ionsNoDup: Ion[] = [];
    this.getMatchedPeakEnvelopePairs().forEach(pair => {
      let ion = pair.getIon().getId();
      if (alreadyAddedIons.indexOf(ion) < 0) {
        ionsNoDup.push(pair.getIon());
        alreadyAddedIons.push(ion);
      } 
    })
    return ionsNoDup.length;
  }
  getUnexpectedModCount(): number {
    let protObj: Proteoform = this.getProteoform();
    let unexpectedMod: MassShift[] = protObj.getUnknownMassShift();
    return unexpectedMod.length;
  }
  getEValue(): number {
    return this.eValue_;
  }
  getQValue(): number {
    return this.qValue_;
  }
  getBreakPoints(): BreakPoints[] {
    return this.breakPoints_;
  }
  getMatchedPeakEnvelopePairs(): MatchedPeakEnvelopePair[] {
    return this.matchedPeakEnvelopePair_;
  }
  getMatchedPeaks(): Peak[] {
    let peaks: Peak[] = [];
    this.getMatchedPeakEnvelopePairs().forEach(pair => {
      peaks.push(pair.getPeak());
    })
    return peaks;
  }
  getMatchedIons(): Ion[] {
    let alreadyAddedIons: string[] = [];
    let ionsNoDup: Ion[] = [];
    this.getMatchedPeakEnvelopePairs().forEach(pair => {
      let ion = pair.getIon().getId();
      if (alreadyAddedIons.indexOf(ion) < 0) {
        ionsNoDup.push(pair.getIon());
        alreadyAddedIons.push(ion);
      } 
    })
    return ionsNoDup;
  }
  setBreakPoints(breakPoints: BreakPoints[]): void {
    this.breakPoints_ = breakPoints;
  }
  setProteoform(proteoform: Proteoform): void {
    this.proteoform_ = proteoform;
  }
  setMatchedPeakEnvelopePairs(matchedPairs: MatchedPeakEnvelopePair[]): void {
    let ionsNoDup: string[] = [];
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
class Envelope {
  private monoMass_: number;
  private charge_: number;
  private intensity_: number;
  private displayColor_: string = "";
  private displayLevel_: number = -1;
  private peaks_ : Peak[] = [];
  private id_: number = -1;   // envelope id in its spectrum (TopFD env_id), -1 if unknown
  private refMass_: number | undefined;   // reference (most abundant) isotope mass, if known

  constructor(monoMass: number, charge: number, intensity: number = -1) {
    this.monoMass_ = monoMass;
    this.charge_ = charge;
    this.intensity_ = intensity;
  }
  getMonoMass(): number {
    return this.monoMass_;
  }
  getCharge(): number {
    return this.charge_;
  }
  getIntensity(): number {
    return this.intensity_;
  }
  getDisplayColor(): string {
    return this.displayColor_;
  }
  getDisplayLevel(): number {
    return this.displayLevel_;
  }
  getPeaks(): Peak[] {
    return this.peaks_;
  }
  getId(): number {
    return this.id_;
  }
  setId(id: number): void {
    this.id_ = id;
  }
  getRefMass(): number | undefined {
    return this.refMass_;
  }
  setRefMass(refMass: number): void {
    this.refMass_ = refMass;
  }
  // m/z of the reference isotope, undefined when ref mass is unknown
  getRefMz(): number | undefined {
    if (this.refMass_ === undefined) return undefined;
    return this.refMass_ / this.charge_ + 1.007276;
  }
  setDisplayColor(displayColor: string): void {
    this.displayColor_ = displayColor;
  }
  setDisplayLevel(displayLevel: number): void {
    this.displayLevel_ = displayLevel;
  }
  addPeaks(peak: Peak): void {
    this.peaks_.push(peak);
  }
}
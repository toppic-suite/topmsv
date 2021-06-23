class Peak {
  private peakId_: string;
  private pos_: number;//mz if spectrum peak, mono mass if decov. peak
  private monoMass_: number | undefined;
  private monoMz_: number;
  private charge_: number | undefined;
  private intensity_: number;
  private displayLevel_: number = -1;

  constructor(peakId: string, pos: number, monoMz: number, intensity: number, monoMass?: number, charge?: number) {
    this.peakId_ = peakId;
    this.pos_ = pos;
    this.monoMass_ = monoMass;
    this.monoMz_ = monoMz;
    this.charge_ = charge;
    this.intensity_ = intensity;
  }
  getId(): string {
    return this.peakId_;
  }
  getPos(): number {
    return this.pos_;
  }
  getMonoMass(): number | undefined {
    return this.monoMass_;
  }
  getMonoMz(): number {
    return this.monoMz_;
  }
  getCharge(): number | undefined {
    return this.charge_;
  }
  getIntensity(): number {
    return this.intensity_;
  }
  getDisplayLevel(): number {
    return this.displayLevel_;
  }
  setDisplayLevel(displayLevel: number): void {
    this.displayLevel_ = displayLevel;
  }
  setIntensity(intensity: number): void {
    this.intensity_ = intensity;
  }
}
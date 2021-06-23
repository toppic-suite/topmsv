class TheoMass {
  private mass_: number;
  private pos_: number;
  private ion_: string = "";

  constructor(mass: number, pos: number) {
    this.mass_ = mass;
    this.pos_ = pos;
  }
  getMass(): number {
    return this.mass_;
  }
  setMass(mass: number) {
    this.mass_ = mass;
  }
  getPos(): number {
    return this.pos_;
  }
  getIon(): string {
    return this.ion_;
  }
  setIon(ion: string) {
    this.ion_ = ion;
  }
}
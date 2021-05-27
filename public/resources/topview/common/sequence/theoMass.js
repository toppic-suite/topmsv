class TheoMass {
  constructor(mass, pos) {
    this.mass_ = parseFloat(mass);
    this.pos_ = pos;
    this.ion_ = "";
  }
  getMass() {
    return this.mass_;
  }
  setMass(mass) {
    this.mass_ = parseFloat(mass);
  }
  getPos() {
    return this.pos_;
  }
  getIon() {
    return this.ion_;
  }
  setIon(ion) {
    this.ion_ = ion;
  }
}
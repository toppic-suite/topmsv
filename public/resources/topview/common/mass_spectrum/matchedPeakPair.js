class MatchedPeakPair{
  constructor(theoMass, envelope = []) {
    //this.monoPeakId_ = monoPeakId;
    this.theoMass_ = theoMass;
    this.envelope_ = envelope;
  }
  getEnvelope() {
    return this.envelope_;
  }
  getTheoMass() {
    return this.theoMass_;
  }
  /*getMonoPeakId() {
    return this.monoPeakId_;
  }*/
  setTheoMass(mass) {
    this.theoMass = mass;
  }
  addEnvelope(env) {
    this.envelope_ = this.envelope_.concat(env);
  }
}
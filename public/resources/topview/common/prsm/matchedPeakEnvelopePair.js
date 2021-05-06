class MatchedPeakEnvelopePair{
  constructor(theoMass, monoPeak, ion, envelope = []) {
    this.theoMass_ = theoMass;
    this.peak_ = monoPeak;
    this.ion_ = ion;
    this.envelope_ = envelope;//only one envelope per object
  }
  getPeak() {
    return this.peak_;
  }
  getIon() {
    return this.ion_;
  }
  getEnvelope() {
    return this.envelope_;
  }
  getTheoMass() {
    return this.theoMass_;
  }
  setTheoMass(mass) {
    this.theoMass = mass;
  }
  addEnvelope(env) {
    //this.envelope_ = this.envelope_.concat(env);
    if (this.envelope_.length > 0) {
      alert("error with envelope. see console.");
      console.log(this.envelope_, env);
    }else{
      this.envelope_ = env;
    }
  }
}